"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { Github, Rocket, ArrowRight } from "lucide-react";
import LoginButton from "@/components/LoginButton";

export function LandingHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 w-full h-full bg-background z-0">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/20 to-transparent blur-[120px] opacity-30 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-20" />
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center">
        
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 bg-muted/50 border border-border rounded-full px-3 py-1 mb-8 backdrop-blur-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium text-muted-foreground">v1.0 Now Available</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1 
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="block text-foreground mb-2">Build faster with</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-x">
            Broslunas CMS
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          The open-source, Git-based CMS designed for Astro. 
          <br className="hidden md:block" />
          Manage your content collections without leaving your workflow.
        </motion.p>

        {/* Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {isLoggedIn ? (
            <Link href="/dashboard">
               <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 gap-2">
                 Go to Dashboard <ArrowRight className="w-5 h-5" />
               </Button>
            </Link>
          ) : (
             <div onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
               <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 gap-2">
                 <Github className="w-5 h-5" /> Sign in with GitHub
               </Button>
             </div>
          )}
          
          <Link href="https://github.com/broslunas/cms" target="_blank">
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50 backdrop-blur-sm gap-2">
              <Github className="w-5 h-5" /> Star on GitHub
            </Button>
          </Link>
        </motion.div>

        {/* Floating Elements (Optional Visual Flair) */}
        <FloatingIcons />
      </div>
    </section>
  );
}

function FloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Icon 1: JSON */}
      <motion.div 
        className="absolute top-1/4 left-10 md:left-20 bg-background/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-xl rotate-[-6deg]"
        animate={{ 
          y: [0, -20, 0],
          rotate: [-6, -10, -6] 
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <code className="text-sm font-mono text-purple-500">.json</code>
      </motion.div>

      {/* Icon 2: Markdown */}
      <motion.div 
        className="absolute bottom-1/4 right-10 md:right-20 bg-background/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-xl rotate-[6deg]"
        animate={{ 
          y: [0, 20, 0],
          rotate: [6, 12, 6] 
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
      >
        <code className="text-sm font-mono text-blue-500">.mdx</code>
      </motion.div>
      
      {/* Icon 3: Git */}
      <motion.div 
        className="absolute top-1/3 right-[15%] hidden lg:block bg-background/80 backdrop-blur-md border border-border p-3 rounded-lg shadow-lg rotate-[12deg]"
        animate={{ 
          y: [0, -15, 0],
          rotate: [12, 8, 12] 
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 2
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-mono text-muted-foreground">git push</span>
        </div>
      </motion.div>
    </div>
  )
}
