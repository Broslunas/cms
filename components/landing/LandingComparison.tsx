"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FileText, ShoppingBag, Book, Code, Mic, ChevronRight, ChevronDown, GripVertical, Trash2, Image as ImageIcon, Plus, Play, Pause, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const useCases = [
  {
    id: "blog",
    label: "Blog Post",
    icon: FileText,
    data: {
      title: "The Future of Web Development",
      author: ["Alex Rivera", "Sarah Chen"],
      date: "2024-03-15",
      tags: ["React", "Astro", "Web"],
      content: "## Introduction\n\nThe web is evolving at a rapid pace. Static sites are making a comeback..."
    }
  },
  {
    id: "podcast",
    label: "Podcast Episode",
    icon: Mic,
    data: {
      title: "Ep. 42: Origins of the Universe",
      audioHost: "s3://bucket/ep42.mp3",
      duration: "45:20",
      guests: [
         { name: "Dr. Tyson", role: "Astrophysicist", avatar: "/avatars/tyson.jpg" },
         { name: "Bill Nye", role: "Science Guy", avatar: "/avatars/bill.jpg" }
      ],
      transcription: [
        { start: "00:00", speaker: "Host", text: "Welcome back to the show everyone." },
        { start: "00:15", speaker: "Dr. Tyson", text: "It's great to be here. The universe is vast." }
      ],
      content: "In this episode we discuss the big bang theory and what came before..."
    }
  },
  {
    id: "ecommerce",
    label: "Product",
    icon: ShoppingBag,
    data: {
      title: "Ergonomic Mechanical Keyboard",
      price: 199.99,
      gallery: [
        { src: "/products/kb-front.jpg", alt: "Front view" },
        { src: "/products/kb-side.jpg", alt: "Side profile" }
      ],
      features: ["Wireless", "RGB", "Hot-swappable"],
      content: "Experience the ultimate typing comfort with our new ergonomic series..."
    }
  }
];

export function LandingComparison() {
  const [activeCase, setActiveCase] = useState(useCases[1]); // Default to podcast to show off complex fields
  const [viewMode, setViewMode] = useState<"cms" | "code">("cms");

  return (
    <section className="py-24 bg-muted/20 overflow-hidden" id="showcase">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            See it in Action
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Complex content? No problem.
          </h2>
          <p className="text-muted-foreground text-lg">
            From simple blog posts to complex data structures like arrays, objects, and transcriptions.
            Broslunas CMS adapts to your Astro schema.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
          <div className="flex p-1 bg-muted rounded-full border border-border">
            {useCases.map((useCase) => (
              <button
                key={useCase.id}
                onClick={() => setActiveCase(useCase)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  activeCase.id === useCase.id 
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <useCase.icon className="w-4 h-4" />
                {useCase.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-full border border-border">
            <span className={cn("text-sm font-medium transition-colors", viewMode === "cms" ? "text-primary" : "text-muted-foreground")}>Editor</span>
            <Switch 
              checked={viewMode === "code"} 
              onCheckedChange={(c) => setViewMode(c ? "code" : "cms")}
            />
            <span className={cn("text-sm font-medium transition-colors", viewMode === "code" ? "text-primary" : "text-muted-foreground")}>Code (.md)</span>
          </div>
        </div>

        {/* Window Container */}
        <div className="relative max-w-5xl mx-auto group perspective-1000">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          
          <motion.div 
            layout
            className="relative bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col"
          >
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs font-mono text-muted-foreground hidden sm:block">
                {viewMode === "cms" ? "Broslunas CMS - Editor" : `src/content/${activeCase.id}/${activeCase.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`}
              </div>
              <div className="w-16" /> 
            </div>

            {/* Content Area */}
            <div className="flex-1 p-0 bg-background relative overflow-hidden flex flex-col">
               <AnimatePresence mode="wait">
                 {viewMode === "cms" ? (
                   <motion.div 
                     key="cms"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     transition={{ duration: 0.3 }}
                     className="h-full flex flex-col overflow-y-auto max-h-[600px]"
                   >
                     {/* CMS Interface Mock */}
                     <CMSEditorMock data={activeCase.data} type={activeCase.id} />
                   </motion.div>
                 ) : (
                   <motion.div
                     key="code"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.3 }}
                     className="h-full bg-[#1e1e1e] p-6 text-sm font-mono overflow-auto max-h-[600px]"
                   >
                     <CodeView data={activeCase.data} type={activeCase.id} />
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CMSEditorMock({ data, type }: { data: any, type: string }) {
  return (
    <div className="flex flex-col h-full bg-background/50">
      
      {/* 1. Editor Header / Meta Info */}
      <div className="border-b border-border bg-card/30 p-4 flex items-center justify-between">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Collection: <strong>{type}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Synced</span>
             </div>
             <div className="font-mono text-xs opacity-50">src/content/{type}/{data.title.toLowerCase().replace(/ /g, '-')}.md</div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 text-xs">History</Button>
             <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground">Save Changes</Button>
          </div>
      </div>

      <div className="flex flex-col md:flex-row h-full">
          {/* 2. Metadata Visual Editor (Left/Top) */}
          <div className="w-full md:w-[400px] border-r border-border bg-muted/10 p-4 space-y-6 overflow-y-auto">
             
             {/* Text Fields */}
             <div className="space-y-4">
               <div className="space-y-1.5">
                 <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Title</Label>
                 <input type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" value={data.title} readOnly />
               </div>
               
               {data.date && (
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Publish Date</Label>
                   <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" value={data.date} readOnly />
                 </div>
               )}
               
               {data.price && (
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Price</Label>
                   <div className="relative"> 
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input type="number" className="w-full bg-background border border-border rounded-lg pl-6 pr-3 py-2 text-sm" value={data.price} readOnly />
                   </div>
                 </div>
               )}
             </div>

             {/* Array Fields Visually Rich */}
             {data.gallery && (
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Gallery (Array)</Label>
                     <Badge variant="outline" className="text-[10px] h-4">2 Items</Badge>
                  </div>
                  <div className="space-y-2">
                     {data.gallery.map((img: any, i: number) => (
                        <div key={i} className="group flex items-center gap-3 bg-card border border-border rounded-lg p-2 hover:border-primary/50 transition-colors">
                           <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{img.src}</div>
                              <div className="text-[10px] text-muted-foreground truncate">Alt: {img.alt}</div>
                           </div>
                           <div className="p-1 hover:bg-muted rounded cursor-pointer"><GripVertical className="w-3 h-3 text-muted-foreground" /></div>
                        </div>
                     ))}
                     <Button variant="ghost" size="sm" className="w-full text-xs h-8 border border-dashed border-border"><Plus className="w-3 h-3 mr-2" /> Add Image</Button>
                  </div>
               </div>
             )}

             {data.guests && (
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Guests (Object Array)</Label>
                  </div>
                  <div className="space-y-2">
                     {data.guests.map((guest: any, i: number) => (
                        <div key={i} className="bg-card border border-border rounded-lg p-3 space-y-2 hover:border-primary/50 transition-colors">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shrink-0" />
                              <span className="text-xs font-bold">{guest.name}</span>
                           </div>
                           <div className="text-[10px] text-muted-foreground pl-8">{guest.role}</div>
                        </div>
                     ))}
                  </div>
               </div>
             )}

             {/* Complex Transcription Field */}
             {data.transcription && (
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Auto-Transcription</Label>
                     <Button variant="ghost" size="icon" className="h-5 w-5"><Wand2 className="w-3 h-3 text-purple-500" /></Button>
                   </div>
                   <div className="max-h-[150px] overflow-y-auto space-y-1 bg-background border border-border rounded-lg p-2">
                      {data.transcription.map((line: any, i: number) => (
                         <div key={i} className="flex gap-2 text-xs p-1 hover:bg-muted/50 rounded group">
                            <span className="font-mono text-muted-foreground shrink-0 w-10">{line.start}</span>
                            <span className="font-bold text-primary shrink-0">{line.speaker}:</span>
                            <span className="text-foreground/80 truncate group-hover:whitespace-normal">{line.text}</span>
                         </div>
                      ))}
                   </div>
                </div>
             )}

          </div>

          {/* 3. Markdown Content Editor (Right/Bottom) */}
          <div className="flex-1 p-6 bg-background relative flex flex-col min-h-[300px]">
             <div className="flex items-center justify-between mb-4">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Content Body (Markdown)</Label>
                <div className="flex gap-1">
                   <Button variant="ghost" size="icon" className="h-6 w-6"><b className="font-serif text-xs">B</b></Button>
                   <Button variant="ghost" size="icon" className="h-6 w-6"><i className="font-serif text-xs">I</i></Button>
                   <Button variant="ghost" size="icon" className="h-6 w-6"><ImageIcon className="w-3 h-3" /></Button>
                </div>
             </div>
             
             <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                <p className="text-foreground whitespace-pre-wrap font-mono text-sm leading-relaxed opacity-90">
                  {data.content}
                </p>
             </div>
             
             {/* Dropzone Simulation */}
             <div className="absolute inset-x-6 bottom-6 h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:border-primary/50 transition-all cursor-pointer">
                <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                <span className="text-xs font-medium">Drag & drop images here</span>
             </div>
          </div>
      </div>

    </div>
  )
}

function CodeView({ data, type }: { data: any, type: string }) {
  const frontmatter = Object.entries(data)
    .filter(([key]) => key !== 'content')
    .map(([key, value]) => {
      let valString = value;
      if (Array.isArray(value)) {
         if (typeof value[0] === 'object') {
             valString = `\n${value.map(v => `  - ${JSON.stringify(v)}`).join('\n')}`;
         } else {
             valString = `[${value.map(v => `"${v}"`).join(', ')}]`;
         }
      }
      else if (typeof value === 'string') valString = `"${value}"`;
      
      return `${key}: ${valString}`;
    })
    .join('\n');

  return (
    <div className="font-mono leading-relaxed">
      <span className="text-blue-400">---</span><br/>
      {frontmatter.split('\n').map((line, i) => {
        const [key, ...rest] = line.split(':');
        return (
          <div key={i} className="whitespace-pre">
            <span className="text-sky-300">{key}</span>: <span className="text-orange-300">{rest.join(':')}</span>
          </div>
        )
      })}
      <span className="text-blue-400">---</span><br/>
      <br/>
      <div className="text-gray-300 whitespace-pre-wrap">
        {data.content}
      </div>
    </div>
  )
}
