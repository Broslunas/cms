import { auth } from "@/lib/auth";
import { listUserRepos, isAstroRepo, promiseAllWithLimit } from "@/lib/octokit";
import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // En NextAuth v5 con GitHub, el access token está en la cuenta
    const accessToken = session.access_token as string;
    const userId = session.user.id;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No GitHub access token found" },
        { status: 400 }
      );
    }

    // 1. Obtener repos de GitHub
    const repos = await listUserRepos(accessToken);

    // 2. Obtener repos ya importados de la BD
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(userId));

    const importedProjects = await userCollection
      .find({ type: "project" }, { projection: { repoId: 1 } })
      .toArray();
    
    // Crear un Set de IDs de repos importados de forma segura
    const importedRepoIds = new Set(
      importedProjects
        .filter(p => p.repoId) // Asegurarse de que repoId existe
        .map((p) => p.repoId)
    );

    // 3. Filtrar repos que ya están importados
    const availableRepos = repos.filter(
      (repo) => !importedRepoIds.has(repo.full_name)
    );

    // 4. Filtrar solo repositorios que usan Astro (en paralelo con límite para evitar rate limiting)
    const astroChecks = await promiseAllWithLimit(
      availableRepos,
      10, // Máximo 10 peticiones simultáneas
      async (repo) => {
        const [owner, repoName] = repo.full_name.split("/");
        const usesAstro = await isAstroRepo(accessToken, owner, repoName);
        return usesAstro ? repo : null;
      }
    );
    
    // Filtrar los null (repos que no son Astro)
    const astroRepos = astroChecks.filter((repo) => repo !== null);

    return NextResponse.json(astroRepos);
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
