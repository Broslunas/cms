
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const repoId = searchParams.get("repoId");

    if (!repoId) {
      return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // Try to find the project in user's own collection first
    let project = await userCollection.findOne({ type: "project", repoId: repoId });
    let isShared = false;

    // If not found, check if this is a shared project
    if (!project) {
        const sharedRef = await userCollection.findOne({ 
            type: "shared_project_reference", 
            repoId 
        });

        if (sharedRef) {
            // Access the owner's collection to get the project configuration
            const ownerCollection = db.collection(getUserCollectionName(sharedRef.ownerId));
            project = await ownerCollection.findOne({ 
                type: "project", 
                repoId: repoId 
            });
            isShared = true;
        }
    }

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ 
        uniqueId: project._id,
        vercelConfig: project.vercelConfig || {},
        s3Config: project.s3Config || {},
        collaborators: project.collaborators || [], 
        isShared 
    });

  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
        repoId, 
        vercelProjectId, 
        vercelToken, 
        useGlobalToken,
        s3Endpoint,
        s3Region,
        s3AccessKey,
        s3SecretKey,
        s3Bucket,
        s3PublicUrl,
        useGlobalS3,
        useGlobalCredentials
    } = await req.json();

    if (!repoId) {
      return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
    }

    // Connect to DB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // Check if this is a shared project (user cannot modify settings for shared projects)
    const sharedRef = await userCollection.findOne({ 
        type: "shared_project_reference", 
        repoId 
    });

    if (sharedRef) {
        return NextResponse.json({ 
            error: "Cannot modify settings for shared repositories. Only the owner can configure deployments." 
        }, { status: 403 });
    }

    // Construct the $set object
    const finalUpdate: any = {};
    if (vercelProjectId !== undefined) finalUpdate["vercelConfig.projectId"] = vercelProjectId;
    if (vercelToken !== undefined) finalUpdate["vercelConfig.token"] = vercelToken;
    if (useGlobalToken !== undefined) finalUpdate["vercelConfig.useGlobalToken"] = useGlobalToken;

    if (s3Endpoint !== undefined) finalUpdate["s3Config.endpoint"] = s3Endpoint;
    if (s3Region !== undefined) finalUpdate["s3Config.region"] = s3Region;
    if (s3AccessKey !== undefined) finalUpdate["s3Config.accessKey"] = s3AccessKey;
    if (s3SecretKey !== undefined) finalUpdate["s3Config.secretKey"] = s3SecretKey;
    if (s3Bucket !== undefined) finalUpdate["s3Config.bucket"] = s3Bucket;
    if (s3PublicUrl !== undefined) finalUpdate["s3Config.publicUrl"] = s3PublicUrl;
    if (useGlobalS3 !== undefined) finalUpdate["s3Config.useGlobalS3"] = useGlobalS3;
    if (useGlobalCredentials !== undefined) finalUpdate["s3Config.useGlobalCredentials"] = useGlobalCredentials;


    const result = await userCollection.updateOne(
      { type: "project", repoId: repoId },
      { $set: finalUpdate }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
