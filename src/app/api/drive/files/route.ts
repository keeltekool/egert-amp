import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listAudioFiles, listFolders } from "@/lib/drive";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const folderId = req.nextUrl.searchParams.get("folderId") || undefined;

  try {
    const [files, folders] = await Promise.all([
      listAudioFiles(session.accessToken, folderId),
      listFolders(session.accessToken, folderId),
    ]);

    return NextResponse.json({ files, folders });
  } catch (error) {
    console.error("Drive API error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
