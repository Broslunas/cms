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
    let schemas = await userCollection
      .find({
        type: "schema",
        userId: session.user.id,
        repoId: repoId,
      })
      .toArray();
    
    // También buscar colecciones únicas usadas en los posts (para cuando no existen schemas explicítos)
    const distinctCollections = await userCollection.distinct("collection", {
      type: "post",
      repoId: repoId,
      userId: session.user.id
    });

    // Normalizar colecciones de posts (remover nulls y "blog" si ya existe)
    const postCollections = (distinctCollections as string[])
        .filter(Boolean)
        .map(c => c || "blog");
    
    // Combinar con schemas existentes
    const knownSchemaNames = new Set(schemas.map(s => s.name));
    
    // Para cada colección encontrada en posts que no tenga schema, creamos uno "virtual"
    for (const colName of postCollections) {
        if (!knownSchemaNames.has(colName)) {
            // Intentamos obtener un post reciente para inferir campos (opcional, para el selector)
            const samplePost = await userCollection.findOne(
                { type: "post", repoId, collection: colName },
                { projection: { metadata: 1 } }
            );
            
            // Inferir campos simples
            const inferredFields: any = {};
            if (samplePost?.metadata) {
                Object.keys(samplePost.metadata).forEach(k => {
                    inferredFields[k] = { type: 'string', optional: true };
                });
            }

            schemas.push({
                _id: new ObjectId(),
                type: "schema",
                userId: session.user.id,
                repoId,
                name: colName,
                fields: inferredFields,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            knownSchemaNames.add(colName);
        }
    }

    // Si no hay schemas ni colecciones, usar el default
    if (schemas.length === 0) {
       schemas.push({
         _id: new ObjectId(),
         type: "schema",
         userId: session.user.id,
         repoId,
         name: "blog",
         fields: {},
         createdAt: new Date(),
         updatedAt: new Date()
       });
    }

    // Determinar colección
    let selectedCollection = collection;

    // Si no hay colección seleccionada
    if (!selectedCollection) {
      // Si solo hay un schema (colección), usar ese automáticamente
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
        selectedCollection = "blog";
      }
    }

    // Encontrar el schema seleccionado (ahora incluye los virtuales)
    let selectedSchema = schemas.find(s => s.name === selectedCollection) || null;

    // Obtener posts existentes de esta colección para usarlos como plantilla
    const templatePosts = await userCollection
      .find({
        type: "post",
        repoId: repoId,
        collection: selectedCollection
      })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();

    // Si tenemos templates pero no un schema real (o es muy básico), intentamos mejorar el schema inferido
    if ((!selectedSchema || Object.keys(selectedSchema.fields).length === 0) && templatePosts.length > 0) {
        const inferredFields: any = {};
        // Usar el primer post como referencia
        if (templatePosts[0].metadata) {
             Object.keys(templatePosts[0].metadata).forEach(k => {
                 const value = templatePosts[0].metadata[k];
                 let type = typeof value;
                 if (Array.isArray(value)) type = "array";
                 
                 inferredFields[k] = { type: type, optional: true };
             });
        }
        
        // Crear un objeto schema si no existía o actualizar sus campos
        if (!selectedSchema) {
            selectedSchema = { fields: inferredFields } as any; // Mock parcial
        } else {
            selectedSchema.fields = inferredFields;
        }
    }

    // Serializar templatePosts
    const serializedTemplates = templatePosts.map(p => ({
        _id: p._id.toString(),
        repoId: p.repoId,
        filePath: p.filePath,
        metadata: p.metadata,
        content: p.content,
        status: p.status,
        collection: p.collection,
    }));

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
      <div className="min-h-screen bg-background text-foreground">
        <PostEditor 
            post={emptyPost} 
            schema={selectedSchema?.fields || null} 
            isNew={true}
            templatePosts={serializedTemplates}
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
    <div className="min-h-screen bg-background text-foreground">
      <PostEditor post={serializedPost} schema={schema?.fields || null} />
    </div>
  );
}
