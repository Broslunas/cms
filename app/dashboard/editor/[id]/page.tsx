import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import PostEditor from "@/components/PostEditor";

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ repo?: string; collection?: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const { repo: repoId, collection } = await searchParams;

  if (!session?.user) {
    redirect("/");
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const userCollection = db.collection(getUserCollectionName(session.user.id));

  // --- MODO CREACIÓN (Nuevo Post) ---
  if (id === "new") {
    if (!repoId) {
      redirect("/dashboard");
    }

    // Obtener todos los schemas disponibles para este repo
    const schemas = await userCollection
      .find({
        type: "schema",
        userId: session.user.id,
        repoId: repoId,
      })
      .toArray();

    // Si no hay schemas, usar el default
    if (schemas.length === 0) {
      // Default schema fallback
    }

    // Determinar colección
    let selectedCollection = collection;

    // Si no hay colección seleccionada
    if (!selectedCollection) {
      // Si solo hay un schema, usar ese automáticamente
      if (schemas.length === 1) {
        selectedCollection = schemas[0].name;
      } else if (schemas.length > 1) {
        // Si hay varios, mostrar selector
        const importCollectionSelector = await import("@/components/CollectionSelector");
        const CollectionSelector = importCollectionSelector.default;
        
        return (
          <CollectionSelector 
            schemas={schemas.map(s => ({ name: s.name, fields: s.fields }))} 
            repoId={repoId} 
          />
        );
      } else {
        // Fallback si no hay schemas detectados (ej: repo vacío o sin config)
        selectedCollection = "blog";
      }
    }

    // Encontrar el schema seleccionado
    const selectedSchema = schemas.find(s => s.name === selectedCollection) || null;

    // Construir post vacío
    const emptyPost = {
      _id: "new",
      repoId,
      filePath: "", // Se definirá al guardar
      metadata: {},
      content: "",
      status: "draft",
      collection: selectedCollection || "blog",
    };

    return (
      <div className="min-h-screen bg-black">
        <PostEditor 
            post={emptyPost} 
            schema={selectedSchema?.fields || null} 
            isNew={true}
        />
      </div>
    );
  }

  // --- MODO EDICIÓN (Post Existente) ---
  
  // Obtener el post de la colección del usuario
  const post = await userCollection.findOne({
    _id: new ObjectId(id),
    type: "post",
    userId: session.user.id,
  });

  if (!post) {
    redirect("/dashboard");
  }

  // Obtener el schema de la colección
  const schema = await userCollection.findOne({
    type: "schema",
    userId: session.user.id,
    repoId: post.repoId,
    collectionName: post.collection || "blog",
  });

  // Serializar el post para pasar al componente cliente
  const serializedPost = {
    _id: post._id.toString(),
    userId: post.userId,
    repoId: post.repoId,
    filePath: post.filePath,
    sha: post.sha,
    metadata: post.metadata,
    content: post.content,
    status: post.status,
    collection: post.collection || "blog",
  };

  return (
    <div className="min-h-screen bg-black">
      <PostEditor post={serializedPost} schema={schema?.fields || null} />
    </div>
  );
}
