import { auth } from "@/lib/auth";
import { getOctokit } from "@/lib/octokit";
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

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { error: "Missing required parameters (owner, repo, path)" },
        { status: 400 }
      );
    }

    const accessToken = session.access_token as string;
    const octokit = getOctokit(accessToken);

    const query = `
      query($owner: String!, $repo: String!, $path: String!) {
        repository(owner: $owner, name: $repo) {
          object(expression: "HEAD") {
            ... on Commit {
              blame(path: $path) {
                ranges {
                  startingLine
                  endingLine
                  age
                  commit {
                    oid
                    message
                    author {
                      name
                      avatarUrl(size: 32)
                      date
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result: any = await octokit.graphql(query, {
      owner,
      repo,
      path,
    });

    const ranges = result.repository.object.blame.ranges;

    return NextResponse.json({ ranges });
  } catch (error) {
    console.error("Error fetching blame:", error);
    return NextResponse.json(
      { error: "Failed to fetch blame" },
      { status: 500 }
    );
  }
}
