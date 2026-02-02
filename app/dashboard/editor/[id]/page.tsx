import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import PostEditor from "@/components/PostEditor";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/");
  }

  // Obtener el post de la colección del usuario
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const userCollection = db.collection(getUserCollectionName(session.user.id));
  
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
