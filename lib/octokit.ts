import { Octokit } from "@octokit/rest";

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
      
      return "astro" in deps || "astro" in devDeps;
    }
    
    return false;
  } catch (error) {
    // Si no hay package.json, no es un proyecto Astro
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
      for (const item of data) {
        if (item.type === "file" && (item.name.endsWith(".md") || item.name.endsWith(".mdx"))) {
          files.push(item.path);
        } else if (item.type === "dir") {
          // Recursivamente buscar en subdirectorios
          const subFiles = await listContentFiles(accessToken, owner, repo, item.path);
          files.push(...subFiles);
        }
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
