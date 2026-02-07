"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Terminal, FileCode, Search, Code, Layout } from "lucide-react";

export function LandingShowcase() {
  const [activeTab, setActiveTab] = useState<"config" | "content">("config");

  const codeSnippets = {
    config: `// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content', // v2.0 ready
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    image: z.string().optional(),
    pubDate: z.date(),
  }),
});

export const collections = { blog };`,
    content: `---
title: "Hello World"
tags: ["astro", "cms"]
pubDate: 2024-03-10
---

# Welcome to Broslunas CMS

Edit this content directly in your browser.
Changes are committed largely to your repo.
`
  };

  return (
    <section className="py-24 bg-background overflow-hidden relative">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
             <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Designed for Developers, <br/>
                <span className="text-primary">Loved by Editors.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Broslunas CMS bridges the gap between code and content. 
                Keep your developers happy with Git-based workflows while giving your editors a powerful visual interface.
              </p>
            </motion.div>

            <div className="space-y-6">
              <FeatureItem 
                icon={Terminal}
                title="Git-Native"
                description="Everything is a commit. Branches, PRs, and history are built-in."
                delay={0.1}
              />
              <FeatureItem 
                icon={Layout}
                title="Visual Editing"
                description="Real-time preview and intuitive fields for non-technical users."
                delay={0.2}
              />
              <FeatureItem 
                icon={Code}
                title="Type Safety"
                description="Your content is validated against your schema before it's saved."
                delay={0.3}
              />
            </div>
          </div>

          <motion.div 
            className="relative lg:h-[600px] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Window Chrome */}
            <div className="w-full max-w-xl bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 overflow-hidden relative z-10 block">
              <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-white/5">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex space-x-4 text-xs font-mono">
                  <button 
                    onClick={() => setActiveTab("config")}
                    className={`px-3 py-1 rounded transition-colors ${activeTab === "config" ? "bg-[#1e1e1e] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    config.ts
                  </button>
                  <button 
                    onClick={() => setActiveTab("content")}
                    className={`px-3 py-1 rounded transition-colors ${activeTab === "content" ? "bg-[#1e1e1e] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    index.md
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-x-auto min-h-[300px]">
                <pre className="font-mono text-sm leading-relaxed text-[#d4d4d4]">
                  <code>
                    {activeTab === "config" ? (
                      <ConfigCode />
                    ) : (
                      <ContentCode />
                    )}
                  </code>
                </pre>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full z-0 pointer-events-none" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function FeatureItem({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      className="flex gap-4"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </motion.div>
  )
}

function ConfigCode() {
  return (
    <>
      <span className="text-[#6a9955]">// src/content/config.ts</span>{"\n"}
      <span className="text-[#c586c0]">import</span> {"{ defineCollection, z }"} <span className="text-[#c586c0]">from</span> <span className="text-[#ce9178]">'astro:content'</span>;{"\n\n"}
      <span className="text-[#569cd6]">const</span> blog = <span className="text-[#dcdcaa]">defineCollection</span>({"{"}{"\n"}
      {"  "}<span className="text-[#9cdcfe]">type</span>: <span className="text-[#ce9178]">'content'</span>,{"\n"}
      {"  "}<span className="text-[#9cdcfe]">schema</span>: z.<span className="text-[#dcdcaa]">object</span>({"{"}{"\n"}
      {"    "}<span className="text-[#9cdcfe]">title</span>: z.<span className="text-[#dcdcaa]">string</span>(),{"\n"}
      {"    "}<span className="text-[#9cdcfe]">tags</span>: z.<span className="text-[#dcdcaa]">array</span>(z.<span className="text-[#dcdcaa]">string</span>()),{"\n"}
      {"    "}<span className="text-[#9cdcfe]">image</span>: z.<span className="text-[#dcdcaa]">string</span>().<span className="text-[#dcdcaa]">optional</span>(),{"\n"}
      {"    "}<span className="text-[#9cdcfe]">pubDate</span>: z.<span className="text-[#dcdcaa]">date</span>(),{"\n"}
      {"  "}{"}"}),{"\n"}
      {"}"});{"\n\n"}
      <span className="text-[#c586c0]">export</span> <span className="text-[#569cd6]">const</span> collections = {"{ blog }"};
    </>
  )
}

function ContentCode() {
  return (
    <>
      <span className="text-[#569cd6]">---</span>{"\n"}
      <span className="text-[#9cdcfe]">title</span>: <span className="text-[#ce9178]">"Hello World"</span>{"\n"}
      <span className="text-[#9cdcfe]">tags</span>: [<span className="text-[#ce9178]">"astro"</span>, <span className="text-[#ce9178]">"cms"</span>]{"\n"}
      <span className="text-[#9cdcfe]">pubDate</span>: <span className="text-[#b5cea8]">2024-03-10</span>{"\n"}
      <span className="text-[#569cd6]">---</span>{"\n\n"}
      <span className="text-[#569cd6]"># Welcome to Broslunas CMS</span>{"\n\n"}
      Edit this content directly in your browser.{"\n"}
      Changes are committed largely to your repo.
    </>
  )
}
