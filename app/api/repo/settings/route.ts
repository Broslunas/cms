
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

    const project = await userCollection.findOne({ type: "project", repoId: repoId });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ 
        uniqueId: project._id, // Just to have an ID
        vercelConfig: project.vercelConfig || {} 
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

    const { repoId, vercelProjectId, vercelToken, useGlobalToken } = await req.json();

    if (!repoId) {
      return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
    }

    // Connect to DB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // Construct the $set object
    const finalUpdate: any = {};
    if (vercelProjectId !== undefined) finalUpdate["vercelConfig.projectId"] = vercelProjectId;
    if (vercelToken !== undefined) finalUpdate["vercelConfig.token"] = vercelToken;
    if (useGlobalToken !== undefined) finalUpdate["vercelConfig.useGlobalToken"] = useGlobalToken;


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
