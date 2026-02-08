import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Learn about how we use cookies to improve your experience on Broslunas CMS.",
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: February 6, 2026</p>
      
      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">1. What are cookies?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small text files that are stored on your device when you visit a website. They help the website function properly and provide information to the site owners.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">2. Cookies We Use</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use different types of cookies to run our website:
          </p>
          <div className="space-y-4">
            <div>
               <h3 className="font-semibold text-foreground">Essential Cookies</h3>
               <p className="text-muted-foreground text-sm">
                 These are necessary for the website to function and cannot be switched off. We use <strong>NextAuth.js</strong> cookies to handle user authentication and session management. Without these, you would not be able to log in.
               </p>
            </div>
            <div>
               <h3 className="font-semibold text-foreground">Analytics Cookies</h3>
               <p className="text-muted-foreground text-sm">
                 We use <strong>Google Analytics 4 (GA4)</strong> to understand how visitors interact with our website. These cookies (such as <code>_ga</code> and <code>_gid</code>) collect information anonymously, including the number of visitors and pages visited. This helps us improve our service.
               </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">3. Managing Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            You can control and/or delete cookies as you wish using your browser settings. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit a site and some services and functionalities (like logging in) may not work.
          </p>
        </section>
      </div>
    </div>
  );
}
