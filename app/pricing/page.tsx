import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { Rocket } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description: "Check our flexible plans for Broslunas CMS. Currently free during beta.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center py-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -skew-y-2 origin-top-left z-0"></div>
        <div className="container mx-auto relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center justify-center p-3 mb-8 rounded-full bg-primary/10 text-primary">
            <Rocket className="w-6 h-6 mr-2" />
            <span className="font-semibold">Coming Soon</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Flexible Plans <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              on the way
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
            We are finalizing our pricing plans to offer you the best option for your needs. In the meantime, enjoy all features <strong>completely for free</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link href="/dashboard">
               <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
                 Start for Free Now
               </Button>
             </Link>
          </div>
        </div>
      </section>
      
      <SiteFooter />
    </div>
  );
}
