import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Link } from "next-view-transitions";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";

import SyncButton from "@/components/SyncButton";
import { VercelDeployments, ProjectSettings } from "@/components/VercelIntegration";
import RepoFilters from "@/components/RepoFilters";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RepoInvitationAlert } from "@/components/RepoInvitationAlert";
import { PostItem } from "@/components/dashboard/PostItem";


export default async function ReposPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    repo?: string; 
    q?: string; 
    status?: string; 
    collection?: string; 
  }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user || session.error === "RefreshAccessTokenError") {
    redirect("/login");
  }

  const repoId = params.repo;

  if (!repoId) {
    redirect("/dashboard");
  }

  const query = params.q?.toLowerCase() || "";
  const status = params.status || "all";
  const collectionFilter = params.collection || "all";

  // Get repository posts
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const userCollection = db.collection(getUserCollectionName(session.user.id));
  
  let targetCollection = userCollection;
  let postQuery: any = { type: "post", repoId };

  // Check if this is a shared project
  const sharedRef = await userCollection.findOne({ 
      type: "shared_project_reference", 
      repoId 
  });

  if (sharedRef) {
       // Switch to owner's collection
       targetCollection = db.collection(getUserCollectionName(sharedRef.ownerId));
       // No userId filter needed here as we are in owner's collection and filtering by repoId
  } else {
       // Own project
       postQuery.userId = session.user.id;
  }

  let posts: any[] = await targetCollection
    .find(postQuery)
    .sort({ updatedAt: -1 })
    .toArray();

  // Get unique collections before filtering
  const uniqueCollections = Array.from(new Set(posts.map(p => p.collection || "blog")));

  // Apply in-memory filters
  if (query) {
    posts = posts.filter(post => {
      const title = post.metadata.title || "";
      const path = post.filePath || "";
      const content = post.content || "";
      
      return (
        title.toLowerCase().includes(query) ||
        path.toLowerCase().includes(query) ||
        content.toLowerCase().includes(query)
      );
    });
  }

  if (status !== "all") {
    posts = posts.filter(post => post.status === status);
  }

  if (collectionFilter !== "all") {
    posts = posts.filter(post => (post.collection || "blog") === collectionFilter);
  }

  // Serialize posts for Client Component
  posts = posts.map(post => ({
    ...post,
    _id: post._id.toString(),
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
    lastCommitAt: post.lastCommitAt ? new Date(post.lastCommitAt).toISOString() : null,
  }));

  return (
    <main className="container max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="space-y-6">
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                   <ArrowLeft className="h-4 w-4" />
                   Back
                </Button>
             </Link>
             <div className="h-4 w-px bg-border hidden md:block" />
             <div>
                <h1 className="text-xl font-bold tracking-tight">Content</h1>
                <p className="text-sm text-muted-foreground font-mono">{repoId}</p>
             </div>
           </div>

           <div className="flex items-center gap-3">
              <VercelDeployments repoId={repoId} />
              <Link href={`/dashboard/editor/new?repo=${encodeURIComponent(repoId)}`}>
                 <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New post
                 </Button>
              </Link>
              <SyncButton repoId={repoId} />
              <ProjectSettings repoId={repoId} />
           </div>
        </div>

        {/* GitHub Invitation (only shown if there is a pending one for this repo) */}
        <RepoInvitationAlert repoId={repoId} />

        {/* Filters */}
        <RepoFilters collections={uniqueCollections} />

        {/* Posts List */}
        <div className="space-y-1">
           <div className="text-sm text-muted-foreground pb-2 ml-1">
              {posts.length} {posts.length === 1 ? "result" : "results"}
           </div>

          {posts.length === 0 ? (
            <div className="text-center p-12 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">
                No posts were found with these filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post: any) => (
                <PostItem key={post._id.toString()} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
