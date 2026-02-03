import { Octokit } from "@octokit/rest";

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
    auth: accessToken,
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
  path: string
) {
  const octokit = getOctokit(accessToken);
  
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
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
  const octokit = getOctokit(accessToken);

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    sha, // Si existe, actualiza; si no, crea
  });

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
  const octokit = getOctokit(accessToken);

  const { data } = await octokit.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
  });

  return data;
}
