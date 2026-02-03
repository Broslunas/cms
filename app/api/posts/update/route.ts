import { auth } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { serializeMarkdown } from "@/lib/markdown";
import { updateFile } from "@/lib/octokit";
import { PostMetadataSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, metadata, content, commitToGitHub } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Ya no validamos estrictamente con PostMetadataSchema para permitir borradores
    // y edición de posts antiguos o incompletos.
    // La validación de tipos se maneja en el frontend.

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

    // 1. Actualizar en MongoDB primero
    await userCollection.updateOne(
      { _id: new ObjectId(postId), type: "post" },
      {
        $set: {
          metadata,
          content,
          status: commitToGitHub ? "synced" : "modified",
          updatedAt: new Date(),
        },
      }
    );

    // 2. Si se solicita commit a GitHub
    if (commitToGitHub) {
      const accessToken = session.access_token as string;
      const [owner, repo] = post.repoId.split("/");

      // Serializar a markdown
      const markdownContent = serializeMarkdown(metadata, content);

      // Actualizar en GitHub
      const result = await updateFile(
        accessToken,
        owner,
        repo,
        post.filePath,
        markdownContent,
        `Update ${post.metadata.title || post.filePath}`,
        post.sha // SHA actual del archivo
      );

      // Actualizar el SHA en MongoDB
      await userCollection.updateOne(
        { _id: new ObjectId(postId), type: "post" },
        {
          $set: {
            sha: result.sha,
            lastCommitAt: new Date(),
            status: "synced",
          },
        }
      );

      return NextResponse.json({
        success: true,
        committed: true,
        newSha: result.sha,
        commitSha: result.commit,
        owner,
        repo,
      });
    }

    return NextResponse.json({ success: true, committed: false });
  } catch (error: any) {
    console.error("Error updating post:", error);

    // Manejar errores de conflicto de GitHub (409)
    if (error.status === 409) {
      return NextResponse.json(
        {
          error: "Conflict: File has been modified externally",
          code: "CONFLICT",
        },
        { status: 409 }
      );
    }

    // Detectar errores de permisos de GitHub (403)
    if (error.status === 403 || error.message?.includes("not accessible by integration")) {
      return NextResponse.json(
        {
          error: "No tienes permisos para hacer commits en GitHub",
          code: "PERMISSION_ERROR",
          details: "Necesitas crear una GitHub App con permisos de Contents: Read & Write"
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
