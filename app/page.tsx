import { auth } from "@/lib/auth";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { SiteFooter } from "@/components/site-footer";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <LandingHero isLoggedIn={isLoggedIn} />
      <LandingFeatures />
      <LandingComparison />
      <LandingCTA isLoggedIn={isLoggedIn} />
      <SiteFooter />
    </main>
  );
}
