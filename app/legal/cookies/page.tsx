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
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. What are cookies?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small text files that websites you visit place on your computer. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How we use cookies</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use cookies for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Essential Cookies:</strong> Necessary for the website to function. They allow us to remember your login preferences and keep your session secure.</li>
            <li><strong className="text-foreground">Performance Cookies:</strong> Help us understand how visitors interact with the website, collecting and reporting information anonymously.</li>
            <li><strong className="text-foreground">Functionality Cookies:</strong> Allow the website to remember choices you make (such as your username, language, or the region you are in) and provide enhanced, more personal features.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Cookie Management</h2>
          <p className="text-muted-foreground leading-relaxed">
            Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, as it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Third-Party Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            In some special cases, we also use cookies provided by trusted third parties. The following site details which third-party cookies you might encounter through this site.
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
             <li>This site uses Google Analytics, which is one of the most widespread and trusted analytics solutions on the web for helping us to understand how you use the site and ways that we can improve your experience.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
