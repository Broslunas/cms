import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
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

  // Obtener el post
  const client = await clientPromise;
  const db = client.db("astro-cms");
  const post = await db.collection("posts").findOne({
    _id: new ObjectId(id),
    userId: session.user.id,
  });

  if (!post) {
    redirect("/dashboard");
  }

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <PostEditor post={serializedPost} />
    </div>
  );
}
