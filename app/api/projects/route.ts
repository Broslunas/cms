import { auth } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// GET - Listar proyectos importados del usuario y compartidos
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // 1. Fetch own projects
    const ownProjects = await userCollection
      .find({ type: "project" })
      .toArray();

    // 2. Fetch shared references
    const sharedRefs = await userCollection
      .find({ type: "shared_project_reference" })
      .toArray();

    // 3. Resolve shared projects from owners' collections
    const sharedProjectsPromises = sharedRefs.map(async (ref) => {
      try {
        const ownerCollection = db.collection(getUserCollectionName(ref.ownerId));
        const project = await ownerCollection.findOne({ 
          type: "project", 
          repoId: ref.repoId 
        });
        
        if (project) {
          // Identify as shared and attach ownerId explicitly if needed
          // (project.userId is already the owner's ID)
          return {
            ...project,
            isShared: true,
            sharedBy: ref.ownerId
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching shared project ${ref.repoId} from ${ref.ownerId}:`, error);
        return null;
      }
    });

    const sharedProjects = (await Promise.all(sharedProjectsPromises)).filter(p => p !== null);

    // 4. Combine and Sort by updatedAt
    const allProjects = [...ownProjects, ...sharedProjects].sort((a: any, b: any) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
    });

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
