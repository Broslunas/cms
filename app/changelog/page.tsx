import { Link } from "next-view-transitions";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Rocket, Zap, Bug, GitBranch } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Stay updated with the latest features, improvements, and bug fixes in Broslunas CMS.",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-12">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Changelog</h1>
            <p className="text-xl text-muted-foreground">
                Discover the latest updates and improvements of Broslunas CMS.
            </p>
        </div>

        <div className="relative border-l border-border ml-3 md:ml-6 space-y-12">
            
            {/* Entry 1 */}
            <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    <h2 className="text-2xl font-bold">v1.0.0 - Official Launch</h2>
                    <Badge variant="secondary" className="w-fit">February 6, 2026</Badge>
                </div>
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <p>
                        Today marks an important milestone. Broslunas CMS is out of beta and available primarily for you. 
                        We have worked hard to bring you the best content management experience for Astro.
                    </p>
                    <ul className="list-none pl-0 space-y-2 mt-4">
                        <li className="flex items-start">
                            <Rocket className="mr-3 h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span><strong>Git-based Workflow:</strong> Every change is a commit. No intermediate databases.</span>
                        </li>
                        <li className="flex items-start">
                            <Zap className="mr-3 h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                            <span><strong>Astro Collections Support:</strong> Automatic import of schemas from your `config.ts`.</span>
                        </li>
                        <li className="flex items-start">
                             <GitBranch className="mr-3 h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span><strong>Visual Editor:</strong> Edit Markdown, MDX, and JSON with an intuitive and powerful interface.</span>
                        </li>
                    </ul>
                </div>
            </div>

             {/* Entry 2 */}
             <div className="relative pl-8 md:pl-12">
                <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    <h2 className="text-xl font-semibold text-muted-foreground">Public Beta</h2>
                    <Badge variant="outline" className="w-fit">January 1, 2026</Badge>
                </div>
                <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground">
                    <p>
                        We opened the doors to our first beta users. Thanks to your feedback, we've polished the user experience and fixed critical bugs.
                    </p>
                     <ul className="list-none pl-0 space-y-2 mt-4">
                        <li className="flex items-start">
                            <Bug className="mr-3 h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <span>Bug fixes in GitHub authentication.</span>
                        </li>
                        <li className="flex items-start">
                            <Zap className="mr-3 h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <span>Performance improvements for loading large repositories.</span>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
