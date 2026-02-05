
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

    // 1. Get Vercel Config from DB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // Try to find the project in user's own collection first
    let project = await userCollection.findOne({ type: "project", repoId: repoId });
    let ownerCollection = userCollection;

    // If not found, check if this is a shared project
    if (!project) {
        const sharedRef = await userCollection.findOne({ 
            type: "shared_project_reference", 
            repoId 
        });

        if (sharedRef) {
            // Access the owner's collection to get the project configuration
            ownerCollection = db.collection(getUserCollectionName(sharedRef.ownerId));
            project = await ownerCollection.findOne({ 
                type: "project", 
                repoId: repoId 
            });
        }
    }

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const vercelConfig = project.vercelConfig || {};
    let token = vercelConfig.token;
    const projectId = vercelConfig.projectId;

    if (vercelConfig.useGlobalToken) {
        // Use the owner's global token (from owner's settings)
        const settings = await ownerCollection.findOne({ type: "settings" });
        if (settings?.vercelGlobalToken) {
            token = settings.vercelGlobalToken;
        }
    }

    if (!projectId || !token) {
        return NextResponse.json({ 
            notConfigured: true, 
            message: "Vercel integration not configured" 
        });
    }

    // 2. Fetch Deployments from Vercel API
    const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Vercel API error:", errorText);
        
        if (res.status === 403 || res.status === 401) {
             return NextResponse.json({ error: "Invalid Vercel Token", invalidToken: true }, { status: 401 });
        }
        if (res.status === 404) {
             return NextResponse.json({ error: "Vercel Project ID not found", invalidProject: true }, { status: 404 });
        }
        
        return NextResponse.json({ error: "Failed to fetch from Vercel" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching Vercel deployments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
