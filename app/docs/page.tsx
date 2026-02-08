import { Button } from "@/components/ui/button"
import { Link } from "next-view-transitions"
import { ArrowRight, Book, Code2, GitBranch, Layers, Settings, Sparkles, Terminal } from "lucide-react"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Comprehensive guide to using Broslunas CMS. Learn about installation, core concepts, features, and more.",
};

export default function DocsPage() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-12">
      <div className="space-y-4 border-b pb-8">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl gradient-text">
          Documentation
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          Learn how to integrate, configure, and get the most out of <strong>Broslunas CMS</strong> for your Astro projects.
        </p>
        <div className="flex gap-4 pt-4">
          <Link href="/docs/getting-started/installation">
            <Button size="lg" className="rounded-full">
              Start Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="https://github.com/apps/broslunas-cms" target="_blank">
             <Button variant="outline" size="lg" className="rounded-full">
               Install on GitHub
             </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardLink 
          href="/docs/getting-started/installation"
          title="Quick Installation"
          description="Configure the GitHub App and connect your first repository in minutes."
          icon={<Terminal className="h-6 w-6" />}
        />
        <CardLink 
          href="/docs/core-concepts/collections"
          title="Astro Collections"
          description="Understand how we automatically map your Astro content schemas."
          icon={<Layers className="h-6 w-6" />}
        />
        <CardLink 
          href="/docs/features/visual-editor"
          title="Visual Editor"
          description="Rich editing for Markdown, MDX, and complex metadata."
          icon={<Sparkles className="h-6 w-6" />}
        />
        <CardLink 
          href="/docs/features/collaboration"
          title="Collaboration"
          description="Invite your team and manage granular access permissions."
          icon={<Settings className="h-6 w-6 effect-glow" />}
        />
      </div>

      <div className="space-y-6 pt-8">
        <h2 className="text-2xl font-bold tracking-tight">Key Concepts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card/50">
                <GitBranch className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Git-based</h3>
                <p className="text-sm text-muted-foreground">Every change is a commit. You have total control and traceability.</p>
             </div>
             <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card/50">
                <Code2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Schema Driven</h3>
                <p className="text-sm text-muted-foreground">Your code defines the structure. The CMS adapts to you, not the other way around.</p>
             </div>
             <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card/50">
                <Book className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Zero Config</h3>
                <p className="text-sm text-muted-foreground">No databases to maintain. Just connect your repo and you're good to go.</p>
             </div>
        </div>
      </div>
    </div>
  )
}

function CardLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group block h-full">
      <div className="relative h-full overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
        <div className="flex items-center gap-4 mb-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  )
}
