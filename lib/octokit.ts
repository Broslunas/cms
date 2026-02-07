import { Octokit } from "@octokit/rest";
import { getAppOctokit } from "@/lib/github-app-auth";

// Caché en memoria para verificaciones de Astro (evita llamadas repetidas)
const astroRepoCache = new Map<string, boolean>();

/**
 * Ejecuta promesas con un límite de concurrencia para evitar rate limiting
 */
export async function promiseAllWithLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<any>
): Promise<any[]> {
  const results: any[] = [];
  const executing: Promise<any>[] = [];

  for (const item of items) {
    const promise = fn(item).then(result => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

export function getOctokit(accessToken: string) {
  return new Octokit({
    auth: accessToken.trim(),
    request: {
      fetch: fetch,
    }
  });
}

/**
 * Lista los repositorios del usuario autenticado
 */
export async function listUserRepos(accessToken: string) {
  const octokit = getOctokit(accessToken);
  
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });

  return data;
}

/**
 * Verifica si un repositorio usa Astro
 */
export async function isAstroRepo(
  accessToken: string,
  owner: string,
  repo: string
): Promise<boolean> {
  const cacheKey = `${owner}/${repo}`;
  
  // Verificar si ya tenemos el resultado en caché
  if (astroRepoCache.has(cacheKey)) {
    return astroRepoCache.get(cacheKey)!;
  }
  
  const octokit = getOctokit(accessToken);
  
  try {
    // Intentar obtener package.json
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: "package.json",
    });

    if (!Array.isArray(data) && data.type === "file") {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      const packageJson = JSON.parse(content);
      
      // Verificar si tiene astro en dependencies o devDependencies
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      
      const isAstro = "astro" in deps || "astro" in devDeps;
      
      // Guardar en caché
      astroRepoCache.set(cacheKey, isAstro);
      
      return isAstro;
    }
    
    // No es un archivo, guardar false en caché
    astroRepoCache.set(cacheKey, false);
    return false;
  } catch (error) {
    // Si no hay package.json, no es un proyecto Astro, guardar en caché
    astroRepoCache.set(cacheKey, false);
    return false;
  }
}

/**
 * Obtiene el contenido de un archivo del repositorio
 */
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
) {
  const octokit = getOctokit(accessToken);
  
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    // Verificar que sea un archivo y no un directorio
    if (!Array.isArray(data) && data.type === "file") {
      return {
        content: Buffer.from(data.content, "base64").toString("utf-8"),
        sha: data.sha,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error getting file ${path}:`, error);
    return null;
  }
}

/**
 * Lista los commits de un archivo específico
 */
export async function listFileCommits(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
) {
  const octokit = getOctokit(accessToken);
  
  try {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      path,
      per_page: 20, // Limitamos a los últimos 20 cambios
    });

    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || "Desconocido",
      date: commit.commit.author?.date,
      html_url: commit.html_url,
    }));
  } catch (error) {
    console.error(`Error listing commits for ${path}:`, error);
    return [];
  }
}

/**
 * Lista archivos .md y .mdx en el directorio content
 */
export async function listContentFiles(
  accessToken: string,
  owner: string,
  repo: string,
  path: string = "src/content"
) {
  const octokit = getOctokit(accessToken);
  
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    const files: string[] = [];

    if (Array.isArray(data)) {
      // Separar archivos y directorios
      const immediateFiles = data
        .filter(item => item.type === "file" && (item.name.endsWith(".md") || item.name.endsWith(".mdx")))
        .map(item => item.path);
      
      files.push(...immediateFiles);

      // Procesar subdirectorios en paralelo
      const directories = data.filter(item => item.type === "dir");
      
      if (directories.length > 0) {
        const subFilesArrays = await Promise.all(
          directories.map(dir => listContentFiles(accessToken, owner, repo, dir.path))
        );
        
        // Aplanar el array de arrays
        subFilesArrays.forEach(subFiles => files.push(...subFiles));
      }
    }

    return files;
  } catch (error) {
    console.error(`Error listing content files:`, error);
    return [];
  }
}

const COMMIT_AUTHOR = {
  name: "Broslunas CMS",
  email: "cms@broslunas.com"
};

/**
 * Actualiza o crea un archivo en el repositorio
 */
export async function updateFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
) {
  const appOctokit = await getAppOctokit(owner, repo);
  const octokit = appOctokit || getOctokit(accessToken);

  const requestBody: any = {
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    sha, // Si existe, actualiza; si no, crea
  };

  // Only force author if NOT using the App (App auth defaults to Bot user with correct avatar)
  if (!appOctokit) {
      requestBody.author = COMMIT_AUTHOR;
      requestBody.committer = COMMIT_AUTHOR;
  }

  const { data } = await octokit.repos.createOrUpdateFileContents(requestBody);

  return {
    sha: data.content?.sha,
    commit: data.commit.sha,
  };
}

/**
 * Elimina un archivo del repositorio
 */
export async function deleteFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string
) {
  const appOctokit = await getAppOctokit(owner, repo);
  const octokit = appOctokit || getOctokit(accessToken);

  const requestBody: any = {
    owner,
    repo,
    path,
    message,
    sha,
  };

  if (!appOctokit) {
      requestBody.author = COMMIT_AUTHOR;
      requestBody.committer = COMMIT_AUTHOR;
  }

  const { data } = await octokit.repos.deleteFile(requestBody);

  return data;
}

/**
 * Invita a un colaborador a un repositorio de GitHub
 */
export async function inviteCollaborator(
  accessToken: string,
  owner: string,
  repo: string,
  username: string,
  permission: "pull" | "push" | "admin" | "maintain" | "triage" = "push"
) {
  const octokit = getOctokit(accessToken);

  try {
    await octokit.repos.addCollaborator({
      owner,
      repo,
      username,
      permission,
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Error inviting collaborator ${username}:`, error);
    throw error;
  }
}

/**
 * Lista las invitaciones pendientes de repositorios para el usuario autenticado
 */
export async function listUserRepoInvitations(accessToken: string) {
  const octokit = getOctokit(accessToken);

  try {
    const { data } = await octokit.repos.listInvitationsForAuthenticatedUser();
    return data;
  } catch (error) {
    console.error("Error listing repository invitations:", error);
    return [];
  }
}

/**
 * Acepta una invitación de repositorio
 */
export async function acceptRepoInvitation(
  accessToken: string,
  invitationId: number
) {
  const octokit = getOctokit(accessToken);

  try {
    await octokit.repos.acceptInvitationForAuthenticatedUser({
      invitation_id: invitationId,
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Error accepting invitation ${invitationId}:`, error);
    throw error;
  }
}
