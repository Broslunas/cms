import type { Metadata } from "next";
import { ViewTransitions } from 'next-view-transitions';
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "Broslunas CMS | Manage your Content Collections",
    template: "%s | Broslunas CMS",
  },
  description:
    "The definitive CMS for Astro. Manage your Content Collections directly from GitHub. Fast, secure, and with an intuitive interface.",
  keywords: [
    "astro",
    "cms",
    "github",
    "git",
    "content collections",
    "markdown",
    "editor",
    "static site generator",
    "web development",
  ],
  authors: [{ name: "Broslunas Team" }],
  creator: "Broslunas",
  publisher: "Broslunas",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Broslunas CMS | Manage your Content Collections",
    description:
      "Manage your Astro Content Collections with the power of Git. No databases, direct synchronization with GitHub.",
    siteName: "Broslunas CMS",
  },

  twitter: {
    card: "summary_large_image",
    title: "Broslunas CMS | Manage your Content Collections",
    description:
      "Manage your Astro Content Collections with the power of Git. No databases, direct synchronization with GitHub.",
    creator: "@broslunas",
  },
  icons: {
    icon: "https://cdn.broslunas.com/favicon.ico",
    shortcut: "https://cdn.broslunas.com/favicon.ico",
    apple: "https://cdn.broslunas.com/favicon.ico",
  },
};




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary`}
        >
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="relative flex min-h-screen flex-col">
                {/* Global background decorations */}
                <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                </div>
                
                <SiteHeader />
                <div className="flex-1 relative transition-all duration-300 ease-in-out">{children}</div>
                <CookieBanner />
              </div>
              <Toaster />
              
              {/* Google Analytics */}
              <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-M6PHCZ54EF"
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());

                  gtag('config', 'G-M6PHCZ54EF');
                `}
              </Script>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    name: "Broslunas CMS",
                    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
                    logo: "https://cdn.broslunas.com/logo.png", // Placeholder
                    sameAs: [
                      "https://twitter.com/broslunas",
                      "https://github.com/broslunas",
                    ],
                  }),
                }}
              />
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
