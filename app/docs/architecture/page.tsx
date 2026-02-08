import { Button } from "@/components/ui/button"
import { Link } from "next-view-transitions"
import { ChevronRight, ChevronLeft, Server, GitBranch, Database, ShieldCheck, Cpu } from "lucide-react"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Architecture",
  description: "Learn about the technical architecture of Broslunas CMS and how it synchronizes with GitHub.",
};

export default function ArchitecturePage() {
  return (
    <div className="space-y-10 max-w-3xl pb-10">
      <div className="space-y-4">
         <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Cpu className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-primary">Technical Reference</p>
        </div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          System Architecture
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Designed for speed without sacrificing truth. Understand how we sync MongoDB and GitHub in real-time.
        </p>
      </div>
      
      <div className="space-y-8">
        <section className="space-y-4">
             <h2 className="text-2xl font-bold tracking-tight border-b pb-2">Data Topology</h2>
             <div className="flex flex-col gap-4 items-center justify-center p-8 bg-card rounded-xl border border-dashed border-primary/20">
                <div className="flex flex-wrap justify-center items-center gap-4">
                   <div className="flex flex-col items-center p-4 bg-background border rounded-lg shadow-sm w-24">
                      <span className="mb-2 text-2xl">👤</span>
                      <span className="font-bold text-xs text-center">User</span>
                   </div>
                   <div className="h-0.5 w-8 bg-border hidden sm:block"></div>
                   <div className="flex flex-col items-center p-4 bg-primary/10 border border-primary/20 rounded-lg shadow-sm w-28">
                      <Server className="mb-2 h-6 w-6 text-primary" />
                      <span className="font-bold text-xs text-center">Next.js App</span>
                   </div>
                   <div className="h-0.5 w-8 bg-border hidden sm:block"></div>
                   <div className="flex flex-col items-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg shadow-sm w-28">
                      <Database className="mb-2 h-6 w-6 text-purple-500" />
                      <span className="font-bold text-xs text-center">MongoDB (Hot Cache)</span>
                   </div>
                   <div className="h-0.5 w-8 bg-border hidden sm:block"></div>
                   <div className="flex flex-col items-center p-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm text-white w-28">
                      <GitBranch className="mb-2 h-6 w-6 text-white" />
                      <span className="font-bold text-xs text-center">GitHub API (Source)</span>
                   </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 italic bg-muted py-1 px-3 rounded-full">
                    Optimistic bidirectional synchronization
                </p>
            </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500" /> MongoDB Cache
                 </h3>
                 <p className="text-sm text-muted-foreground">
                     Stores an indexed copy of your parsed files. Enables instant search, advanced filtering, and drafts that aren't yet commits. <strong>It is ephemeral</strong>: it can be rebuilt from scratch if deleted.
                 </p>
            </div>
            <div className="space-y-2">
                 <h3 className="font-bold text-lg flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-foreground" /> GitHub Source
                 </h3>
                 <p className="text-sm text-muted-foreground">
                     The <strong>single source of truth</strong>. A post doesn't truly exist until it's committed to your `main` branch. The CMS always respects the Git history.
                 </p>
            </div>
        </div>

        <section className="space-y-4 pt-4">
             <h2 className="text-2xl font-bold tracking-tight border-b pb-2">Concurrency Management</h2>
             <p className="text-muted-foreground">
                What happens if two people edit the same file? We use optimistic locking based on SHAs.
             </p>
             <ul className="grid gap-2 text-sm text-muted-foreground border-l-2 border-primary/20 pl-4 py-2">
                <li>1. When reading a file, the CMS saves its <code>blob_sha</code>.</li>
                <li>2. When saving, we send the new content along with the known <code>last_sha</code>.</li>
                <li>3. GitHub's API rejects the commit if the remote SHA doesn't match.</li>
                <li>4. The CMS catches the error and asks you to sync before saving.</li>
             </ul>
        </section>
      </div>

      <div className="flex justify-between pt-8 border-t">
         <Link href="/docs/features/json-mode">
           <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
             <ChevronLeft className="mr-2 h-4 w-4" /> JSON Mode
           </Button>
         </Link>
         <Link href="/docs/security">
           <Button className="pr-4 hover:pr-6 transition-all">
             Security <ChevronRight className="ml-2 h-4 w-4" />
           </Button>
         </Link>
      </div>
    </div>
  )
}
