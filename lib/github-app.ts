import { Octokit } from "@octokit/rest";

/**
 * Verifica si el usuario tiene instalada la GitHub App
 * @param accessToken - Token de acceso del usuario
 * @returns true si la app está instalada, false en caso contrario
 */
export async function checkAppInstalled(accessToken: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    
    // Obtener todas las instalaciones de apps del usuario
    const { data: installations } = await octokit.request('GET /user/installations', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    const appName = process.env.GITHUB_APP_NAME;
    if (!appName) {
      console.error('GITHUB_APP_NAME no está definido en las variables de entorno');
      return false;
    }

    // Verificar si nuestra app está en la lista
    const ourApp = installations.installations.find(
      (installation: any) => installation.app_slug === appName
    );

    return !!ourApp;
  } catch (error) {
    console.error('Error checking app installation:', error);
    return false;
  }
}

/**
 * Obtiene la URL para instalar la GitHub App
 * @returns URL de instalación de la GitHub App
 */
export function getAppInstallUrl(): string {
  const appName = process.env.GITHUB_APP_NAME;
  if (!appName) {
    throw new Error('GITHUB_APP_NAME no está definido');
  }
  return `https://github.com/apps/${appName}/installations/new`;
}

/**
 * Obtiene el installation ID de la GitHub App para el usuario
 * @param accessToken - Token de acceso del usuario
 * @returns Installation ID o null si no está instalada
 */
export async function getInstallationId(accessToken: string): Promise<number | null> {
  try {
    const octokit = new Octokit({ auth: accessToken });
    
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
  } catch (error) {
    console.error('Error getting installation ID:', error);
    return null;
  }
}
