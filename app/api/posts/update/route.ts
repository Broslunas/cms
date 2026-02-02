import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
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

    // Validar metadata
    const validationResult = PostMetadataSchema.safeParse(metadata);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid metadata", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("astro-cms");
    const postsCollection = db.collection("posts");

    // Obtener el post actual
    const post = await postsCollection.findOne({
      _id: new ObjectId(postId),
      userId: session.user.id,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Actualizar en MongoDB
    await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: {
          metadata: validationResult.data,
          content,
          status: commitToGitHub ? "synced" : "modified",
          updatedAt: new Date(),
        },
      }
    );

    // Si se solicita commit a GitHub
    if (commitToGitHub) {
      const accessToken = session.access_token as string;
      const [owner, repo] = post.repoId.split("/");

      // Serializar a markdown
      const markdownContent = serializeMarkdown(validationResult.data, content);

      // Hacer commit a GitHub
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
      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
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

    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
