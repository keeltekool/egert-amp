import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseBuffer } from "music-metadata";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { fileIds } = await req.json();
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ error: "Missing fileIds" }, { status: 400 });
  }

  // Process in batches of 5 to avoid hammering Google
  const results: Record<string, { title?: string; artist?: string; album?: string }> = {};
  const batchSize = 5;

  for (let i = 0; i < fileIds.length; i += batchSize) {
    const batch = fileIds.slice(i, i + batchSize);
    const promises = batch.map(async (fileId: string) => {
      try {
        // Only need ~64KB for text metadata (skip large picture blocks)
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Range: "bytes=0-65535",
            },
          }
        );

        if (!res.ok && res.status !== 206) return;

        const buffer = Buffer.from(await res.arrayBuffer());
        const metadata = await parseBuffer(buffer);

        results[fileId] = {
          title: metadata.common.title || undefined,
          artist: metadata.common.artist || undefined,
          album: metadata.common.album || undefined,
        };
      } catch {
        // Skip files that fail to parse
      }
    });

    await Promise.all(promises);
  }

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
