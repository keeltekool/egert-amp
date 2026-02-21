import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseBuffer } from "music-metadata";
import { db } from "@/lib/db";
import { trackMetadata } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { fileIds } = await req.json();
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ error: "Missing fileIds" }, { status: 400 });
  }

  const results: Record<string, { title?: string; artist?: string; album?: string }> = {};
  const failed: string[] = [];

  // 1. Check DB cache first — instant for previously parsed files
  try {
    const cached = await db
      .select()
      .from(trackMetadata)
      .where(inArray(trackMetadata.fileId, fileIds));

    for (const row of cached) {
      if (row.title || row.artist || row.album) {
        results[row.fileId] = {
          title: row.title || undefined,
          artist: row.artist || undefined,
          album: row.album || undefined,
        };
      }
    }
  } catch (err) {
    console.warn("[metadata] DB cache lookup failed:", err instanceof Error ? err.message : err);
  }

  // 2. Find which files still need parsing from Google
  const uncachedIds = fileIds.filter((id: string) => !results[id]);

  // 3. Parse uncached files from Google Drive (batches of 5)
  if (uncachedIds.length > 0) {
    const batchSize = 5;
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);
      const promises = batch.map(async (fileId: string) => {
        try {
          // 128KB is enough for FLAC Vorbis comments (comes before PICTURE block)
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
                Range: "bytes=0-131071",
              },
            }
          );

          if (!res.ok && res.status !== 206) {
            failed.push(fileId);
            return;
          }

          const buffer = Buffer.from(await res.arrayBuffer());
          const metadata = await parseBuffer(buffer);

          const title = metadata.common.title || undefined;
          const artist = metadata.common.artist || undefined;
          const album = metadata.common.album || undefined;

          if (title || artist || album) {
            results[fileId] = { title, artist, album };
          }

          // Cache in DB (fire-and-forget, non-blocking)
          db.insert(trackMetadata)
            .values({ fileId, title: title || null, artist: artist || null, album: album || null })
            .onConflictDoNothing()
            .execute()
            .catch(() => {});
        } catch (err) {
          console.warn(`[metadata] Parse failed for ${fileId}:`, err instanceof Error ? err.message : err);
          failed.push(fileId);
        }
      });

      await Promise.all(promises);
    }
  }

  return NextResponse.json({ results, failed });
}
