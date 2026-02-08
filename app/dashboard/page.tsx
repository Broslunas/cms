import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import clientPromise, { DB_NAME, getUserCollectionName } from "@/lib/mongodb";
import { Link } from "next-view-transitions";
import ImportButton from "@/components/ImportButton";
import DeleteRepoButton from "@/components/DeleteRepoButton";
import ShareProjectButton from "@/components/ShareProjectButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, RefreshCw, FolderGit2, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ObjectId } from "mongodb";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user || session.error === "RefreshAccessTokenError") {
    redirect("/login");
  }

  // Check if the user has the app installed
  if (!session.appInstalled) {
    redirect("/setup");
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

  // 3. Resolve shared projects
  const sharedProjectsPromises = sharedRefs.map(async (ref) => {
      try {
        const ownerCollection = db.collection(getUserCollectionName(ref.ownerId));
        const project = await ownerCollection.findOne({ 
          type: "project", 
          repoId: ref.repoId 
        });
        
        if (project) {
          return {
            ...project,
            _id: ref._id, // Use reference ID for shared projects to allow "leaving" (deleting reference)
            isShared: true,
            sharedBy: ref.ownerId
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    });

  const sharedProjects = (await Promise.all(sharedProjectsPromises)).filter(p => p !== null);

  const allProjects = [...ownProjects, ...sharedProjects].sort((a: any, b: any) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
  });

  // Serialize projects for client consumption
  const serializedProjects = allProjects.map((project: any) => ({
    _id: project._id.toString(),
    repoId: project.repoId,
    name: project.name,
    description: project.description,
    postsCount: project.postsCount,
    lastSync: project.lastSync ? project.lastSync.toISOString() : new Date().toISOString(),
    isShared: !!project.isShared,
    sharedBy: project.sharedBy
  }));

  return (
    <main className="container max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="space-y-12">
        {/* Header with import button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              My Projects
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              {allProjects.length === 0
                ? "Start by importing your first repository"
                : `Managing ${allProjects.length} ${allProjects.length === 1 ? "active project" : "active projects"}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            <ImportButton />
          </div>
        </div>

        {/* Projects Grid */}
        {allProjects.length === 0 ? (
          <div className="text-center py-24 rounded-[2rem] border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FolderGit2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">
                No projects yet
              </h3>
              <p className="text-muted-foreground text-lg">
                Import your first GitHub repository to start managing your content professionally
              </p>
              <div className="pt-4">
                <ImportButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serializedProjects.map((project) => (
              <Link
                key={project.repoId} // Changed key to repoId as _id might collision/change easier or be from different collections? repoId is unique for display here
                href={`/dashboard/repos?repo=${encodeURIComponent(project.repoId)}`}
                className="block group h-full"
              >
                <Card className="h-full premium-card rounded-2xl overflow-hidden flex flex-col relative transition-all hover:shadow-lg border-muted/60">
                  <CardHeader className="space-y-3 pb-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${project.isShared ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-primary/10 border-primary/20 group-hover:bg-primary group-hover:text-white'}`}>
                                {project.isShared ? <Users className="h-5 w-5" /> : <FolderGit2 className="h-5 w-5" />}
                            </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          {project.isShared && (
                              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/10">
                                Shared
                              </div>
                          )}
                          {!project.isShared && (
                              <div className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/10">
                                Active
                              </div>
                          )}
                            
                            {!project.isShared && (
                                <>
                                    <ShareProjectButton repoId={project.repoId} repoName={project.name} />
                                    <DeleteRepoButton projectId={project._id} repoName={project.name} />
                                </>
                            )}
                       </div>
                    </div>
                    <div className="space-y-1 pt-1">
                      <CardTitle className="text-xl font-bold truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="truncate font-mono text-[11px] opacity-70">
                        {project.repoId}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {project.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/40 italic">
                        No description available in the repository
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="text-[11px] font-medium text-muted-foreground/80 border-t bg-muted/30 p-5 flex items-center justify-between">
                     <div className="flex items-center gap-2.5 bg-background/50 px-2.5 py-1.5 rounded-lg border border-border/50">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span>{project.postsCount} posts</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>{new Date(project.lastSync).toLocaleDateString()}</span>
                     </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
