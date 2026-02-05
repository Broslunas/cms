import { auth } from "@/lib/auth";
import { getFileContent } from "@/lib/octokit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");
    const sha = searchParams.get("sha");

    if (!owner || !repo || !path || !sha) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const accessToken = session.access_token as string;
    
    // Fetch current file info from main/master
    const file = await getFileContent(accessToken, owner, repo, path);

    if (!file) {
         // File doesn't exist remotely
         return NextResponse.json({ synced: false, reason: "remote_missing" });
    }

    const synced = file.sha === sha;

    return NextResponse.json({ 
        synced, 
        remoteSha: file.sha 
    });
  } catch (error) {
    console.error("Error checking sync:", error);
    return NextResponse.json(
      { error: "Failed to check sync" },
      { status: 500 }
    );
  }
}
