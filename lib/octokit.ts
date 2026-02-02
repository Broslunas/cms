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
