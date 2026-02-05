import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { listUserRepoInvitations } from "@/lib/octokit";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !session.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const repoId = searchParams.get("repoId");

    const accessToken = session.access_token as string;
    const { getOctokit } = await import("@/lib/octokit");
    const octokit = getOctokit(accessToken);
    
    // Get current GitHub user to verify who we are
    const authRes = await octokit.users.getAuthenticated();
    const user = authRes.data;
    console.log(`Fetching invitations for GitHub user: ${user.login}`);

    // Check if the owner of the target repo is an org
    const [ownerName] = (repoId || "").split("/");
    let isOrg = false;
    try {
        const { data: ownerInfo } = await octokit.users.getByUsername({ username: ownerName });
        isOrg = ownerInfo.type === "Organization";
        console.log(`Owner ${ownerName} is an ${ownerInfo.type}`);
    } catch (e) {
        console.error("Error checking owner type:", e);
    }

    const invitations = await listUserRepoInvitations(accessToken);
    console.log(`GitHub returned ${invitations.length} invitations for ${user.login}`);

    // New diagnostic: list all repositories this user can actually see
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        per_page: 20,
        sort: "updated"
    });
    
    const repoNames = repos.map(r => r.full_name);
    console.log(`User ${user.login} has access to these repos (first 20):`, repoNames);
    
    // Get scopes from headers (case-insensitive)
    const headerKeys = Object.keys(authRes.headers);
    const rawScopes = authRes.headers['x-oauth-scopes'] || authRes.headers['X-OAuth-Scopes'] || "No detectados";
    console.log(`Token Scopes for ${user.login}:`, rawScopes);
    console.log(`Available headers:`, headerKeys);

    return NextResponse.json({ 
        invitations, 
        githubUser: user.login,
        visibleRepos: repoNames,
        scopes: rawScopes,
        ownerType: isOrg ? "Organization" : "User",
        debug: {
            headerKeys,
            invitationsCount: invitations.length,
            visibleReposCount: repoNames.length
        }
    });
  } catch (error: any) {
    console.error("Error fetching GitHub invitations:", error);
    
    if (error.status === 403 || error.status === 401) {
      return NextResponse.json(
        { 
          error: "Permission denied. Your GitHub token might be missing the 'repo' scope. Try logging out and back in.",
          code: "MISSING_SCOPE"
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
