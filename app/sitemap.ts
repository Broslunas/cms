import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const routes = [
    "",
    "/docs",
    "/docs/architecture",
    "/docs/core-concepts/collections",
    "/docs/core-concepts/git-sync",
    "/docs/core-concepts/schemas",
    "/docs/features/ai",
    "/docs/features/collaboration",
    "/docs/features/github-app",
    "/docs/features/json-mode",
    "/docs/features/storage",
    "/docs/features/vercel",
    "/docs/features/version-control",
    "/docs/features/visual-editor",
    "/docs/getting-started/installation",
    "/docs/getting-started/linking-repos",
    "/docs/security",
    "/pricing",
    "/changelog",
    "/legal/cookies",
    "/legal/privacy",
    "/legal/terms",
    "/site-map",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
