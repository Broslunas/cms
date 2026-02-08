"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useGitHubLogin } from "@/hooks/use-github-login";

export function LandingCTA({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { openLoginPopup } = useGitHubLogin();




  return (
    <section className="py-32 relative text-center overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 animate-gradient-xy" />
      </div>

      <div className="container relative z-10 px-4 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Ready to ship faster?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join developers who are already managing their content with the power of Git and Astro.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 gap-2">
                  Go to Dashboard <Rocket className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
                <Button 
                  size="lg" 
                  className="h-14 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 gap-2"
                  onClick={openLoginPopup}
                >
                  Sign Up with GitHub <Rocket className="w-5 h-5" />
                </Button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
