import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const fileId = req.nextUrl.searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  const rangeHeader = req.headers.get("range");

  try {
    // First get file metadata for size and mime type
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=size,mimeType,name`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );

    if (!metaRes.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const meta = await metaRes.json();
    const fileSize = parseInt(meta.size, 10);

    // Stream the file content from Drive
    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.accessToken}`,
    };

    // Support range requests for seeking
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const streamRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers }
    );

    if (!streamRes.ok && streamRes.status !== 206) {
      return NextResponse.json(
        { error: "Failed to stream file" },
        { status: 500 }
      );
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": meta.mimeType || "audio/flac",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    };

    if (streamRes.status === 206) {
      // Partial content response
      const contentRange = streamRes.headers.get("content-range");
      const contentLength = streamRes.headers.get("content-length");
      if (contentRange) responseHeaders["Content-Range"] = contentRange;
      if (contentLength) responseHeaders["Content-Length"] = contentLength;

      return new NextResponse(streamRes.body, {
        status: 206,
        headers: responseHeaders,
      });
    }

    responseHeaders["Content-Length"] = fileSize.toString();

    return new NextResponse(streamRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Stream error:", error);
    return NextResponse.json(
      { error: "Failed to stream file" },
      { status: 500 }
    );
  }
}
