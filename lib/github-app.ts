import { Octokit } from "@octokit/rest";

/**
 * Checks if the user has the GitHub App installed
 * @param accessToken - User access token
 * @returns true if the app is installed, false otherwise
 */
export async function checkAppInstalled(accessToken: string): Promise<boolean> {
  try {
    if (!accessToken) {
      return false;
    }

    console.log(`Checking app installation with token (length: ${accessToken.length}, prefix: ${accessToken.substring(0, 4)}...)`);
    const octokit = new Octokit({ 
      auth: accessToken.trim(),
      request: {
        fetch: fetch,
        timeout: 5000,
      }
    });
    
    // Debug: Verify authenticated user
    try {
      const { data: user } = await octokit.rest.users.getAuthenticated();
      console.log(`Authenticated as: ${user.login} (${user.id})`);
    } catch (userError: any) {
      console.error('FAIL: GET /user failed with token:', userError.status, userError.message);
      if (userError.response) {
        try {
          console.error('Response body:', JSON.stringify(userError.response.data));
          console.error('Response headers:', JSON.stringify(userError.response.headers));
        } catch (e) {
          console.error('Could not log response details');
        }
      }
      return false;
    }
    
    // Get all user app installations
    const { data: installations } = await octokit.apps.listInstallationsForAuthenticatedUser({
      per_page: 100,
    });

    const appName = process.env.GITHUB_APP_NAME;

    if (!appName) {
      console.error('GITHUB_APP_NAME is not defined in environment variables');
      return false;
    }

    // Check if our app is in the list
    // We match against app_slug case-insensitively
    const installedApp = (installations as any).installations?.find(
      (installation: any) => installation.app_slug.toLowerCase() === appName.toLowerCase()
    );

    if (installedApp) {
      // console.log(`App "${appName}" found with installation ID: ${installedApp.id}`);
      return true;
    } else {
      const availableApps = (installations as any).installations?.map((i: any) => i.app_slug).join(', ') || 'none';
      console.log(`[GitHub App] "${appName}" not found. User has: ${availableApps}`);
      return false;
    }
  } catch (error: any) {
    if (error.status === 401) {
      console.error('Error checking app installation: Unauthorized (401). This typically means the access token is invalid or missing the required "read:org" scope.');
    } else {
      console.error('Error checking app installation:', error.message || error);
    }
    return false;
  }
}

/**
 * Gets the URL to install the GitHub App
 * @returns GitHub App installation URL
 */
export function getAppInstallUrl(): string {
  const appName = process.env.GITHUB_APP_NAME;
  if (!appName) {
    console.error('GITHUB_APP_NAME is not defined in environment variables');
    return 'https://github.com/apps'; // Fallback URL
  }
  return `https://github.com/apps/${appName}/installations/new`;
}

/**
 * Gets the GitHub App installation ID for the user
 * @param accessToken - User access token
 * @returns Installation ID or null if not installed
 */
export async function getInstallationId(accessToken: string): Promise<number | null> {
  try {
    const octokit = new Octokit({ 
      auth: accessToken.trim(),
      request: {
        fetch: fetch,
      } 
    });
    
    const { data: installations } = await octokit.request('GET /user/installations', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    const appName = process.env.GITHUB_APP_NAME;
    if (!appName) {
      return null;
    }

    const ourApp = installations.installations.find(
      (installation: any) => installation.app_slug === appName
    );

    return ourApp ? ourApp.id : null;
  } catch (error: any) {
    if (error.status === 401) {
      console.error('Error getting installation ID: Unauthorized (401). Verify "read:org" scope.');
    } else {
      console.error('Error getting installation ID:', error.message || error);
    }
    return null;
  }
}
