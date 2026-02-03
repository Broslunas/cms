import { auth } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { serializeMarkdown } from "@/lib/markdown";
import { updateFile } from "@/lib/octokit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId, collection, metadata, content, filePath, commitToGitHub } = await request.json();

    if (!repoId || !filePath) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // Verificar si ya existe un post con ese filePath en ese repo
    const existingPost = await userCollection.findOne({
      repoId,
      filePath,
      userId: session.user.id,
      type: "post",
    });

    if (existingPost) {
        return NextResponse.json({ error: "A post with this file path already exists." }, { status: 409 });
    }

    // Preparar el nuevo documento
    const newPost: any = {
      type: "post",
      userId: session.user.id,
      repoId,
      collection,
      filePath,
      metadata,
      content,
      status: commitToGitHub ? "synced" : "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      sha: null, 
      lastCommitAt: commitToGitHub ? new Date() : null,
    };

    let createdSha = null;
    let commitSha = null;

    // Si se solicita commit a GitHub
    if (commitToGitHub) {
      const accessToken = session.access_token as string;
      const [owner, repo] = repoId.split("/");

      // Serializar a markdown
      const markdownContent = serializeMarkdown(metadata, content);

      try {
        // Crear en GitHub
        const result = await updateFile(
            accessToken,
            owner,
            repo,
            filePath,
            markdownContent,
            `Create ${metadata.title || filePath}`
        );
        createdSha = result.sha;
        commitSha = result.commit;
        newPost.sha = createdSha;
      } catch (error: any) {
          console.error("GitHub commit error:", error);
          if (error.status === 403 || error.message?.includes("not accessible")) {
              return NextResponse.json( { error: "Permission denied on GitHub", code: "PERMISSION_ERROR" }, { status: 403 });
          }
          throw error;
      }
    }

    // Insertar en MongoDB
    const result = await userCollection.insertOne(newPost);

    const [owner, repo] = repoId.split("/");
    
    return NextResponse.json({
      success: true,
      postId: result.insertedId.toString(),
      committed: commitToGitHub,
      sha: createdSha,
      commitSha: commitSha,
      owner,
      repo,
    });

  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
