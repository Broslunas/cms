import { auth } from "@/lib/auth";
import { listUserRepos, isAstroRepo } from "@/lib/octokit";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // En NextAuth v5 con GitHub, el access token está en la cuenta
    const accessToken = session.access_token as string;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No GitHub access token found" },
        { status: 400 }
      );
    }

    const repos = await listUserRepos(accessToken);

    // Filtrar solo repositorios que usan Astro
    const astroRepos = [];
    
    for (const repo of repos) {
      const [owner, repoName] = repo.full_name.split("/");
      const usesAstro = await isAstroRepo(accessToken, owner, repoName);
      
      if (usesAstro) {
        astroRepos.push(repo);
      }
    }

    return NextResponse.json(astroRepos);
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
