"use client";

import { motion } from "framer-motion";
import { GitBranch, Database, LayoutTemplate, FileJson, Lock, Zap, FileCode, Workflow, Braces } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: GitBranch,
    title: "Native Git Workflow",
    description: "Every change is a commit. Keep full history, revert changes, and work with branches directly from your CMS.",
    className: "md:col-span-2",
  },
  {
    icon: Database,
    title: "No Database Required",
    description: "Your content lives in JSON and Markdown files alongside your code. Zero database maintenance.",
    className: "bg-primary/5 border-primary/20",
  },
  {
    icon: LayoutTemplate,
    title: "Astro Schemes Auto-Import",
    description: "We automatically detect your Astro Content Collections schemas. Type-safety from day one.",
    className: "",
  },
  {
    icon: FileJson,
    title: "Visual JSON Editing",
    description: "Edit complex data structures with an intuitive interface designed for static data.",
    className: "md:col-span-2",
  },
  {
    icon: Braces,
    title: "Type-Safe Content",
    description: "Never worry about breaking your build. Validation happens before you commit.",
    className: "",
  },
  {
    icon: Lock,
    title: "Total Data Ownership",
    description: "No vendor lock-in. If you leave, your content stays in your repo.",
    className: "",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "Optimized for speed. No API calls to fetch content, it's all local.",
    className: "md:col-span-3 bg-gradient-to-r from-muted to-background",
  },
];

export function LandingFeatures() {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Powerful features, simple workflow
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Everything you need to manage your Astro site content, 
            without the bloat of traditional headless CMS.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={feature.className}
            >
              <Card className="h-full border-muted-foreground/10 hover:border-primary/50 transition-colors duration-300 hover:shadow-lg overflow-hidden group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-current transition-colors" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
