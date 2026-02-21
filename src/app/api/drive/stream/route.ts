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
    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.accessToken}`,
    };

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
        { status: streamRes.status }
      );
    }

    const responseHeaders: Record<string, string> = {
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400, immutable",
    };

    // Pass through critical headers from Google
    const passthrough = ["content-type", "content-length", "content-range"];
    for (const key of passthrough) {
      const val = streamRes.headers.get(key);
      if (val) responseHeaders[key] = val;
    }

    // Fallback content-type
    if (!responseHeaders["content-type"]) {
      responseHeaders["content-type"] = "audio/flac";
    }

    return new NextResponse(streamRes.body, {
      status: streamRes.status,
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
