import { Button } from "@/components/ui/button"
import { Link } from "next-view-transitions"
import { 
  Book, 
  FileText, 
  Settings, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  History, 
  ExternalLink,
  ChevronRight,
  Globe,
  Layout
} from "lucide-react"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Navigate through all the pages and documentation of Broslunas CMS.",
};

const sitemapData = [
  {
    title: "General",
    icon: <Globe className="h-5 w-5" />,
    links: [
      { name: "Home", href: "/", description: "The definitive CMS for Astro." },
      { name: "Pricing", href: "/pricing", description: "Plans and features for every need." },
      { name: "Changelog", href: "/changelog", description: "Latest updates and improvements." },
    ]
  },
  {
    title: "Documentation",
    icon: <Book className="h-5 w-5" />,
    links: [
      { name: "Index", href: "/docs", description: "Start here." },
      { name: "Installation", href: "/docs/getting-started/installation", description: "Configure the GitHub App." },
      { name: "Linking Repositories", href: "/docs/getting-started/linking-repos", description: "Connect your projects." },
      { name: "Architecture", href: "/docs/architecture", description: "How it works under the hood." },
      { name: "Security", href: "/docs/security", description: "Permissions and data handling." },
    ]
  },
  {
    title: "Core Concepts",
    icon: <Zap className="h-5 w-5" />,
    links: [
      { name: "Collections", href: "/docs/core-concepts/collections", description: "Mapping Astro schemas." },
      { name: "Git Sync", href: "/docs/core-concepts/git-sync", description: "Automatic synchronization." },
      { name: "Schemas", href: "/docs/core-concepts/schemas", description: "Defining content structure." },
    ]
  },
  {
    title: "Features",
    icon: <Layout className="h-5 w-5" />,
    links: [
      { name: "AI Generation", href: "/docs/features/ai", description: "Smart metadata and content." },
      { name: "Collaboration", href: "/docs/features/collaboration", description: "Work with your team." },
      { name: "GitHub App", href: "/docs/features/github-app", description: "Seamless integration." },
      { name: "JSON Mode", href: "/docs/features/json-mode", description: "Advanced editing." },
      { name: "Storage (S3)", href: "/docs/features/storage", description: "External asset management." },
      { name: "Vercel", href: "/docs/features/vercel", description: "Deployment integration." },
      { name: "Version Control", href: "/docs/features/version-control", description: "Git history and rollbacks." },
      { name: "Visual Editor", href: "/docs/features/visual-editor", description: "Wysiwyg and Markdown." },
    ]
  },
  {
    title: "Legal",
    icon: <ShieldCheck className="h-5 w-5" />,
    links: [
      { name: "Privacy Policy", href: "/legal/privacy", description: "How we protect your data." },
      { name: "Terms of Service", href: "/legal/terms", description: "Usage conditions." },
      { name: "Cookie Policy", href: "/legal/cookies", description: "Tracking and preferences." },
    ]
  }
];

export default function SitemapPage() {
  return (
    <div className="container max-w-6xl py-12 md:py-20">
      <div className="flex flex-col items-center text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight gradient-text">
          Interactive Sitemap
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          A comprehensive overview of all resources available in Broslunas CMS.
          Find everything you need in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sitemapData.map((category, idx) => (
          <div 
            key={idx} 
            className="group p-6 rounded-2xl border bg-card/50 hover:bg-card hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <h2 className="text-xl font-bold tracking-tight">{category.title}</h2>
            </div>
            
            <ul className="space-y-3">
              {category.links.map((link, lIdx) => (
                <li key={lIdx}>
                  <Link 
                    href={link.href}
                    className="flex flex-col gap-0.5 group/link"
                  >
                    <div className="flex items-center text-sm font-semibold group-hover/link:text-primary transition-colors">
                      {link.name}
                      <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                    </div>
                    {link.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {link.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-20 p-8 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center gap-6">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <History className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Dynamic Content</h3>
          <p className="text-muted-foreground max-w-xl">
            This sitemap is automatically updated as we add new features and documentation. 
            Stay tuned for the latest updates in our <Link href="/changelog" className="text-primary hover:underline">Changelog</Link>.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/docs/getting-started/installation">
            <Button className="rounded-full px-8">
              Get Started
            </Button>
          </Link>
          <Link href="https://github.com/broslunas/cms" target="_blank">
            <Button variant="outline" className="rounded-full px-8">
              <ExternalLink className="mr-2 h-4 w-4" /> Github Repo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
