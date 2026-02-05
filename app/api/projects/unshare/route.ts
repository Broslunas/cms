import { auth } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId, userId } = await req.json();

    if (!repoId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields (repoId, userId)" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const myCollection = db.collection(getUserCollectionName(session.user.id));
    const targetCollection = db.collection(getUserCollectionName(userId));

    // 1. Verify ownership and remove collaborator
    const result = await myCollection.updateOne(
      { type: "project", repoId },
      { $pull: { collaborators: { userId: userId } } as any }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // 2. Remove reference from target collection
    await targetCollection.deleteOne({
      type: "shared_project_reference",
      repoId,
      ownerId: session.user.id
    });

    // 3. Optional: Remove from GitHub (optional as it requires extra scopes and might be destructive)
    // For now, we just remove them from the CMS access.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsharing project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
