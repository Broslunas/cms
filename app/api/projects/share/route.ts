import { auth } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId, email, username } = await req.json();

    if (!repoId || (!email && !username)) {
      return NextResponse.json(
        { error: "Missing required fields (repoId, and email or username)" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection("users");
    const myCollection = db.collection(getUserCollectionName(session.user.id));

    // 1. Verify ownership
    const project = await myCollection.findOne({ type: "project", repoId });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you are not the owner" },
        { status: 404 }
      );
    }

    // 2. Find target user
    let targetUser;
    // Check by email even if username is provided to be robust? No, follow input.
    if (email) {
      targetUser = await usersCollection.findOne({ email });
    } else if (username) {
        // Try searching by username (stored from GitHub login)
        targetUser = await usersCollection.findOne({ username: username });
        // Fallback: try by name if username field doesn't exist for some reason?
        if (!targetUser) {
             // Maybe it's 'name'? auth.ts says 'name' is profile.name or login. But username is explicit.
        }
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found. They must have signed in to this app at least once." },
        { status: 404 }
      );
    }

    const targetUserId = targetUser._id.toString();

    if (targetUserId === session.user.id) {
       return NextResponse.json(
        { error: "You cannot share a project with yourself" },
        { status: 400 }
      ); 
    }

    const targetCollection = db.collection(getUserCollectionName(targetUserId));

    // 3. Add to collaborators list in Owner's project
    // We store minimal info to display in the UI
    const collaboratorInfo = {
        userId: targetUserId,
        email: targetUser.email,
        username: targetUser.username || targetUser.name,
        image: targetUser.image,
        addedAt: new Date()
    };

    await myCollection.updateOne(
        { type: "project", repoId },
        { 
            $addToSet: { 
                collaborators: collaboratorInfo
            } 
        }
    );

    // 4. Add reference to Target's collection
    await targetCollection.updateOne(
        { type: "shared_project_reference", repoId, ownerId: session.user.id },
        {
            $set: {
                type: "shared_project_reference",
                repoId,
                ownerId: session.user.id,
                sharedAt: new Date(),
                updatedAt: new Date()
            }
        },
        { upsert: true }
    );

    return NextResponse.json({ success: true, user: collaboratorInfo });

  } catch (error) {
    console.error("Error sharing project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
