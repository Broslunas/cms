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
    // We remove existing entry for this user first to avoid duplicates (idempotent)
    await myCollection.updateOne(
        { type: "project", repoId },
        { 
            $pull: { collaborators: { userId: targetUserId } } as any
        }
    );

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
            $push: { 
                collaborators: collaboratorInfo
            } 
        } as any
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

    // 5. Invite to GitHub repository
    let githubInviteStatus = null;
    const targetGithubUsername = targetUser.username || targetUser.name; // Fallback to name if username not found
    
    console.log(`Attempting to invite ${targetGithubUsername} to ${repoId}`);

    if (targetGithubUsername && session.access_token) {
      try {
        const [owner, repo] = repoId.split("/");
        const { inviteCollaborator } = await import("@/lib/octokit");
        
        await inviteCollaborator(
          session.access_token as string,
          owner,
          repo,
          targetGithubUsername,
          "push" // Grant write access
        );
        
        console.log(`GitHub invitation successfully sent to ${targetGithubUsername}`);
        githubInviteStatus = {
          success: true,
          message: "GitHub invitation sent"
        };
      } catch (error: any) {
        console.error("Error inviting to GitHub:", error);
        githubInviteStatus = {
          success: false,
          error: error.message || "Failed to send GitHub invitation",
          code: error.status,
          targetUser: targetGithubUsername
        };
      }
    } else {
        console.warn(`Cannot invite to GitHub: missing username or access token. Username: ${targetGithubUsername}, Token: ${!!session.access_token}`);
        githubInviteStatus = {
            success: false,
            error: "Could not resolve GitHub username for invitation."
        };
    }

    return NextResponse.json({ 
      success: true, 
      user: collaboratorInfo,
      githubInvite: githubInviteStatus 
    });

  } catch (error) {
    console.error("Error sharing project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
