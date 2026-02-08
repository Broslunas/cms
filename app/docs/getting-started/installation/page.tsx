import { Button } from "@/components/ui/button"
import { Link } from "next-view-transitions"
import { ChevronRight, ChevronLeft, Github, CheckCircle2 } from "lucide-react"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitHub App Installation",
  description: "Securely connect Broslunas CMS to your GitHub account and manage your repositories.",
};

export default function InstallationPage() {
  return (
    <div className="space-y-10 max-w-3xl pb-10">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Github className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-primary">Getting Started</p>
        </div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          GitHub App Installation
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          For Broslunas CMS to read and write to your repositories, you need to install our official GitHub application. This process is secure and gives you total control over which repositories you share.
        </p>
      </div>
      
      <div className="space-y-8">
        <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground text-sm rounded-full w-6 h-6 flex items-center justify-center">1</span>
                Sign In
            </h2>
            <p className="text-muted-foreground">
                Start by signing into Broslunas CMS with your GitHub account. This allows us to authenticate you, but it <strong>does not grant access to your code yet</strong>.
            </p>
        </section>

        <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground text-sm rounded-full w-6 h-6 flex items-center justify-center">2</span>
                Install the App
            </h2>
            <p className="text-muted-foreground">
                Go to your Dashboard. If you haven't configured the integration yet, you will see a prominent notice.
            </p>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <p className="font-mono text-sm mb-4 bg-muted p-2 rounded w-fit">Click on "Install GitHub App"</p>
                <p className="text-sm text-muted-foreground mb-4">You will be redirected to GitHub to authorize the installation. You will have two options:</p>
                <div className="grid gap-3">
                    <div className="p-3 border rounded-lg flex items-start gap-3 bg-background/50">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                            <strong className="block text-sm font-semibold">All repositories</strong>
                            <span className="text-xs text-muted-foreground">Grants permission to all your current and future repositories.</span>
                        </div>
                    </div>
                    <div className="p-3 border rounded-lg flex items-start gap-3 bg-primary/5 border-primary/20">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                            <strong className="block text-sm font-semibold text-primary">Only select repositories (Recommended)</strong>
                            <span className="text-xs text-muted-foreground">Manually select which repositories you want to manage. This is the most secure option.</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="space-y-4">
             <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground text-sm rounded-full w-6 h-6 flex items-center justify-center">3</span>
                Confirmation
            </h2>
             <p className="text-muted-foreground">
              Once the installation on GitHub is complete, you will be automatically redirected to your Dashboard. Your selected repositories will appear ready to be linked.
            </p>
        </section>
      </div>

      <div className="flex justify-between pt-8 border-t">
         <Link href="/docs">
           <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
             <ChevronLeft className="mr-2 h-4 w-4" /> Introduction
           </Button>
         </Link>
         <Link href="/docs/getting-started/linking-repos">
           <Button className="pr-4 hover:pr-6 transition-all">
             Linking Repositories <ChevronRight className="ml-2 h-4 w-4" />
           </Button>
         </Link>
      </div>
    </div>
  )
}
