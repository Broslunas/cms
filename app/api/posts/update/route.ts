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

    const { postId, repoId, metadata, content, commitToGitHub } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));
    
    // Fetch user settings for commit strategy
    const userSettings = await userCollection.findOne({ type: "settings" });
    const authorStrategy = userSettings?.githubCommitStrategy || "bot";
    
    let targetCollection = userCollection;

    // Resolve collection if repoId is provided
    if (repoId) {
        const sharedRef = await userCollection.findOne({ 
           type: "shared_project_reference", 
           repoId 
        });

        if (sharedRef) {
            targetCollection = db.collection(getUserCollectionName(sharedRef.ownerId));
        }
    }

    // Obtener el post actual
    const post = await targetCollection.findOne({
      _id: new ObjectId(postId),
      type: "post",
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 1. Actualizar en MongoDB primero
    await targetCollection.updateOne(
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
        post.sha, // SHA actual del archivo
        { authorStrategy }
      );

      // Actualizar el SHA en MongoDB
      await targetCollection.updateOne(
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
    if (error.status === 403 || error.message?.includes("Resource not accessible by integration") || error.message?.includes("not accessible by integration")) {
      return NextResponse.json(
        {
          error: "No tienes permisos para hacer commits en GitHub.",
          code: "PERMISSION_ERROR",
          details: "Es probable que la GitHub App no esté instalada en este repositorio específico. Ve a la configuración de la App en GitHub y asegúrate de que este repositorio esté seleccionado."
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
