
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

// Cache for installation IDs to avoid repeated API calls
// key: "owner/repo" -> value: installationId
const installationIdCache = new Map<string, number>();

/**
 * Tries to get an Octokit instance authenticated as the GitHub App for a specific repo.
 * Returns null if the App is not configured or not installed on the repo.
 */
export async function getAppOctokit(owner: string, repo: string): Promise<Octokit | null> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    // App not configured in environment
    return null;
  }

  try {
    // fix private key format if needed (handle potential escaped newlines)
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const auth = createAppAuth({
      appId: appId,
      privateKey: formattedPrivateKey,
    });

    // We need the installation ID for this repo
    const cacheKey = `${owner}/${repo}`;
    let installationId = installationIdCache.get(cacheKey);

    if (!installationId) {
      // Authenticate as App (JWT) to find installation
      const appAuthentication = await auth({ type: "app" });
      
      const appOctokit = new Octokit({
        auth: appAuthentication.token
      });

      try {
        const { data: installation } = await appOctokit.apps.getRepoInstallation({
          owner,
          repo,
        });
        
        installationId = installation.id;
        installationIdCache.set(cacheKey, installationId);
      } catch (e: any) {
        if (e.status === 404) {
          // App not installed on this repo
          console.warn(`[GitHub App] App not installed on ${owner}/${repo}`);
          return null;
        }
        throw e;
      }
    }

    if (!installationId) return null;

    // Get connection token for the installation
    const installationAuthentication = await auth({
      type: "installation",
      installationId: installationId,
    });

    return new Octokit({
      auth: installationAuthentication.token,
    });

  } catch (error) {
    console.error("[GitHub App] Error authenticating as app:", error);
    return null;
  }
}
