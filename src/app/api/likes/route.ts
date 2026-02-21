import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { likes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/likes — fetch all liked file IDs for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await db
    .select({ fileId: likes.fileId })
    .from(likes)
    .where(eq(likes.userEmail, session.user.email));

  return NextResponse.json(rows.map((r) => r.fileId));
}

// POST /api/likes — like a track
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  await db
    .insert(likes)
    .values({ userEmail: session.user.email, fileId })
    .onConflictDoNothing();

  return NextResponse.json({ liked: true });
}

// DELETE /api/likes — unlike a track
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  await db
    .delete(likes)
    .where(
      and(eq(likes.userEmail, session.user.email), eq(likes.fileId, fileId))
    );

  return NextResponse.json({ liked: false });
}
