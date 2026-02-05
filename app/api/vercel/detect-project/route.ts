
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId, token: providedToken, useGlobalToken } = await req.json();

    if (!repoId) {
      return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
    }

    let token = providedToken;

    if (useGlobalToken) {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const userCollection = db.collection(getUserCollectionName(session.user.id));
        const settings = await userCollection.findOne({ type: "settings" });
        if (settings?.vercelGlobalToken) {
            token = settings.vercelGlobalToken;
        }
    }

    if (!token) {
        return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // List projects from Vercel
    // We might need pagination if the user has many projects, but let's start with default (usually 20)
    // We can filter by search to narrow it down if the project name matches repo name
    
    // First try: List all projects (first 100) and look for git link match
    const res = await fetch("https://api.vercel.com/v9/projects?limit=100", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
             return NextResponse.json({ error: "Invalid Vercel Token" }, { status: 401 });
        }
        return NextResponse.json({ error: "Failed to fetch projects from Vercel" }, { status: res.status });
    }

    const data = await res.json();
    const projects = data.projects || [];

    // Find the project linked to this repo
    // repoId format is "owner/repo"
    // Vercel project.link might have different structure depending on provider (github, gitlab, bitbucket)
    
    const matchedProject = projects.find((p: any) => {
        if (!p.link) return false;
        
        // Check for GitHub/GitLab/Bitbucket links
        // The structure is typically { type, repo, org, repoId, ... }
        // For GitHub: type: 'github', repo: 'repo-name', org: 'owner-name'
        
        if (p.link.type === 'github' && p.link.org && p.link.repo) {
            const combined = `${p.link.org}/${p.link.repo}`;
            return combined.toLowerCase() === repoId.toLowerCase();
        }
        
        // Sometimes link.repo matches the full name? Unlikely for github.
        
        return false;
    });

    if (matchedProject) {
        return NextResponse.json({ 
            found: true, 
            projectId: matchedProject.id, 
            projectName: matchedProject.name 
        });
    }

    // Fallback: Try searching by repo name (extracted from owner/repo)
    // This is risky if multiple projects verify, but we can return "potential matches"
    const repoName = repoId.split('/')[1];
    const nameMatch = projects.find((p: any) => p.name.toLowerCase() === repoName.toLowerCase());

    if (nameMatch) {
         // Return as found but maybe we should flag it as "name match"
         return NextResponse.json({ 
            found: true, 
            projectId: nameMatch.id, 
            projectName: nameMatch.name,
            matchType: "name_match"
        });
    }

    return NextResponse.json({ found: false });

  } catch (error) {
    console.error("Error detecting project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
