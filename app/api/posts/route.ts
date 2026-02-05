import { auth } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
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
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // 1. Search by Post ID
    if (postId) {
      const post = await userCollection.findOne({
        _id: new ObjectId(postId),
        type: "post",
      });

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      return NextResponse.json(post);
    }

    // 2. Search by Repo ID (List posts)
    // 2. Search by Repo ID (List posts)
    let targetCollection = userCollection;
    let postFilter: any = { type: "post" };

    if (repoId) {
       postFilter.repoId = repoId;

       // Check if this is a shared project
       const sharedRef = await userCollection.findOne({ 
           type: "shared_project_reference", 
           repoId 
       });

       if (sharedRef) {
           // Switch to owner's collection
           targetCollection = db.collection(getUserCollectionName(sharedRef.ownerId));
           // No userId filter needed here as we are in owner's collection and filtering by repoId
       } else {
           // Own project: ensure we only see our own posts
           postFilter.userId = session.user.id;
       }
    } else {
        // List ALL posts (only own posts)
        postFilter.userId = session.user.id;
    }

    const posts = await targetCollection
      .find(postFilter)
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
