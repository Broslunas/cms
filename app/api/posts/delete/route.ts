import { auth } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { deleteFile } from "@/lib/octokit";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, deleteFromGitHub } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // Obtener el post actual
    const post = await userCollection.findOne({
      _id: new ObjectId(postId),
      type: "post",
      userId: session.user.id,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Si se solicita borrar de GitHub
    if (deleteFromGitHub) {
      if (!post.repoId || !post.filePath) {
         return NextResponse.json({ error: "Cannot delete from GitHub: missing repoId or filePath" }, { status: 400 });
      }

      if (!post.sha) {
         return NextResponse.json({ error: "Cannot delete from GitHub: missing file SHA. Sync repo first?" }, { status: 400 });
      }

      const accessToken = session.access_token as string;
      const [owner, repo] = post.repoId.split("/");

      try {
        await deleteFile(
          accessToken,
          owner,
          repo,
          post.filePath,
          post.sha,
          `Delete ${post.filePath}`
        );
      } catch (error: any) {
        console.error("GitHub delete error:", error);
         if (error.status === 403 || error.message?.includes("not accessible")) {
              return NextResponse.json( { error: "Permission denied on GitHub", code: "PERMISSION_ERROR" }, { status: 403 });
          }
         // Si falla GitHub pero el usuario quería borrar, ¿borramos de local? 
         // Mejor fallar y avisar.
         return NextResponse.json({ error: "Failed to delete from GitHub: " + error.message }, { status: 500 });
      }
    }

    // Borrar de MongoDB
    await userCollection.deleteOne({ _id: new ObjectId(postId) });

    return NextResponse.json({ success: true, deletedFromGitHub: deleteFromGitHub });

  } catch (error: any) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
