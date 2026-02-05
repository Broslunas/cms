import { auth } from "@/lib/auth";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const userCollection = db.collection(getUserCollectionName(session.user.id));

    // 1. Intentar encontrar como referencia compartida primero
    const sharedRef = await userCollection.findOne({
        _id: new ObjectId(projectId),
        type: "shared_project_reference"
    });

    if (sharedRef) {
        // Es un proyecto compartido, solo eliminamos la referencia ("Salimos" del proyecto)
        await userCollection.deleteOne({ _id: new ObjectId(projectId) });
        return NextResponse.json({ success: true });
    }

    // 2. Si no es compartido, buscar como proyecto propio
    const project = await userCollection.findOne({
      _id: new ObjectId(projectId),
      type: "project"
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const repoId = project.repoId;

    // 3. Eliminar el proyecto
    await userCollection.deleteOne({
      _id: new ObjectId(projectId),
      type: "project"
    });

    // 4. Eliminar todos los posts asociados a este proyecto/repo
    // Nota: Esto solo elimina los posts de la base de datos local del usuario, no de GitHub.
    await userCollection.deleteMany({
      type: "post",
      repoId: repoId
    });

    // 5. Eliminar schemas asociados si los hay
    await userCollection.deleteMany({
        type: "schema",
        repoId: repoId
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 }
    );
  }
}
