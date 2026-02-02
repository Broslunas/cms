import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");
    const repoId = searchParams.get("repoId");

    const client = await clientPromise;
    const db = client.db("astro-cms");
    const postsCollection = db.collection("posts");

    // Si se solicita un post específico por ID
    if (postId) {
      const post = await postsCollection.findOne({
        _id: new ObjectId(postId),
        userId: session.user.id,
      });

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      return NextResponse.json(post);
    }

    // Si se filtran por repositorio
    const filter: any = { userId: session.user.id };
    if (repoId) {
      filter.repoId = repoId;
    }

    const posts = await postsCollection
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
