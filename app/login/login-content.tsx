"use client";

import { motion } from "framer-motion";
import { Github, ShieldCheck, Zap, Globe, Command, Terminal, Cpu, LayoutTemplate, Layers } from "lucide-react";
import LoginButton from "@/components/LoginButton";

export default function LoginContent() {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* Left Panel - Visual Showcase */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-zinc-900 border-r border-white/10 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 w-full h-full">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 2 }}
            className="absolute -top-[30%] -left-[10%] w-[700px] h-[700px] bg-indigo-500/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 2, delay: 1 }}
            className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]" 
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
        </div>

        {/* Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center gap-2 text-white"
        >
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 shadow-inner">
            <Command className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight"> <a href="/" className="hover:text-primary transition-colors">Broslunas CMS</a> </span>
        </motion.div>

        {/* Center Visual - Abstract Interface */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <motion.div 
            initial={{ rotateX: 20, rotateZ: -20, opacity: 0, scale: 0.9 }}
            animate={{ rotateX: 10, rotateZ: -10, opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative w-full max-w-lg aspect-square"
            style={{ perspective: "1000px" }}
          >
            {/* Floating Cards */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute top-0 right-0 p-6 bg-zinc-800/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-64 z-20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-md bg-indigo-500/20 text-indigo-400">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <div className="bg-white/10 h-2 w-20 rounded mb-1" />
                  <div className="bg-white/5 h-2 w-12 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-white/5 h-16 rounded-lg w-full" />
                <div className="bg-white/5 h-2 w-full rounded" />
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-12 left-0 p-6 bg-zinc-800/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-72 z-30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full bg-red-400" />
                   <div className="h-3 w-3 rounded-full bg-amber-400" />
                   <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <Terminal className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="font-mono text-xs text-zinc-400 space-y-1">
                <p><span className="text-pink-400">const</span> <span className="text-blue-400">cms</span> = <span className="text-yellow-400">new</span> <span className="text-emerald-400">Broslunas</span>();</p>
                <p><span className="text-blue-400">await</span> cms.<span className="text-indigo-400">deploy</span>(<span className="text-cyan-400">'production'</span>);</p>
                <p className="text-emerald-500">✓ Deployment successful</p>
              </div>
            </motion.div>

             <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-dashed border-white/5 z-0"
            />
             <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-white/5 z-0"
            />
          </motion.div>
        </div>

        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10"
        >
          <div className="grid grid-cols-3 gap-6 text-zinc-400 text-sm">
            <div className="flex gap-2 items-center">
              <Cpu className="w-4 h-4" />
              <span>Performant</span>
            </div>
             <div className="flex gap-2 items-center">
              <Layers className="w-4 h-4" />
              <span>Scalable</span>
            </div>
             <div className="flex gap-2 items-center">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
         {/* Mobile background flair (only visible on small screens) */}
         <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent" />
         </div>

         <div className="w-full max-w-sm space-y-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
              <p className="text-muted-foreground">Sign in to your account</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
               <div className="grid gap-2">
                 <LoginButton />
               </div>
               
               <div className="grid gap-4 text-center">
                   <p className="text-xs text-muted-foreground px-8 leading-relaxed">
                      By signing in, you agree to our{" "}
                      <a href="/legal/terms" className="underline hover:text-primary transition-colors">Terms of Service</a>
                      {" "}and{" "}
                      <a href="/legal/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</a>.
                   </p>
               </div>
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.8 }}
               className="pt-8 flex justify-center gap-6 text-muted-foreground"
            >
               <a href="#" className="hover:text-foreground transition-colors"><Github className="w-5 h-5"/></a>
               <a href="#" className="hover:text-foreground transition-colors"><Globe className="w-5 h-5"/></a>
            </motion.div>
         </div>
      </div>
    </div>
  );
}
