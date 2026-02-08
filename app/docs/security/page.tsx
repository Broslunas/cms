import { Button } from "@/components/ui/button"
import { Link } from "next-view-transitions"
import { ChevronLeft, ShieldCheck, Lock, Fingerprint, EyeOff } from "lucide-react"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security & Privacy",
  description: "Learn how Broslunas CMS handles security, privacy, and data protection.",
};

export default function SecurityPage() {
  return (
    <div className="space-y-10 max-w-3xl pb-10">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-primary">Technical Reference</p>
        </div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Security & Privacy
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
           Designed under the principle of least privilege. Your code is never ours; we only borrow it when you say so.
        </p>
      </div>
      
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
            <div className="border bg-card p-6 rounded-xl">
                <div className="text-primary mb-4 bg-primary/10 w-fit p-2 rounded-lg">
                    <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">Ephemeral Tokens</h3>
                <p className="text-sm text-muted-foreground">
                    We never store your personal Access Token permanently. We use GitHub App installation tokens that rotate every hour and are only valid for the repositories you have authorized.
                </p>
            </div>
             <div className="border bg-card p-6 rounded-xl">
                 <div className="text-primary mb-4 bg-primary/10 w-fit p-2 rounded-lg">
                    <Fingerprint className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">Granular Access</h3>
                <p className="text-sm text-muted-foreground">
                    Unlike OAuth, the GitHub App allows you to select repo by repo. You don't have to give us the keys to your entire organization if you only want to edit a blog.
                </p>
            </div>
        </div>

        <section className="space-y-4">
             <h2 className="text-2xl font-bold tracking-tight border-b pb-2">Data Privacy</h2>
             <div className="space-y-4">
                 <div className="flex gap-4 items-start">
                    <EyeOff className="w-5 h-5 mt-1 text-muted-foreground" />
                    <div>
                        <h4 className="font-semibold text-foreground">Your content is yours</h4>
                        <p className="text-sm text-muted-foreground">
                            We do not use your code to train AI models or share it with third parties. The MongoDB cache is isolated and protected.
                        </p>
                    </div>
                 </div>
                 <div className="flex gap-4 items-start">
                    <ShieldCheck className="w-5 h-5 mt-1 text-muted-foreground" />
                    <div>
                        <h4 className="font-semibold text-foreground">Immediate Revocation</h4>
                        <p className="text-sm text-muted-foreground">
                            When you uninstall the App on GitHub, we lose access instantly. Our system detects the revocation and deletes the associated cached data.
                        </p>
                    </div>
                 </div>
             </div>
        </section>
      </div>

      <div className="flex justify-start mt-12 pt-8 border-t">
         <Link href="/docs/architecture">
           <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
             <ChevronLeft className="mr-2 h-4 w-4" /> Architecture
           </Button>
         </Link>
      </div>
    </div>
  )
}
