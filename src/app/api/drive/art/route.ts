import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseBuffer } from "music-metadata";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  try {
    // Fetch first 512KB — enough for FLAC metadata + embedded cover art
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Range: "bytes=0-524287",
        },
      }
    );

    if (!res.ok && res.status !== 206) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const metadata = await parseBuffer(buffer);

    const picture = metadata.common.picture?.[0];
    if (!picture) {
      return NextResponse.json({ error: "No cover art" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(picture.data) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": picture.format,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to extract art" }, { status: 500 });
  }
}
