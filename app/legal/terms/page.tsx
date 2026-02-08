import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms and conditions for using Broslunas CMS.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">Last updated: February 6, 2026</p>
      
      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to Broslunas CMS. By accessing our website and using our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">2. Account Registration & GitHub Integration</h2>
          <p className="text-muted-foreground leading-relaxed">
            To use Broslunas CMS, you must register using your GitHub account. By doing so, you authorize us to access certain information from your GitHub profile as detailed in our Privacy Policy.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            You are responsible for maintaining the security of your GitHub account. Broslunas CMS is not liable for any loss or damage arising from your failure to protect your account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">3. GitHub App Installation</h2>
          <p className="text-muted-foreground leading-relaxed">
            Full functionality of Broslunas CMS requires the installation of our GitHub App on your repositories. You agree to grant the necessary permissions for the application to function, including read and write access to the repositories you choose to manage.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            We reserve the right to verify the installation status of the GitHub App and to restrict access to the Service if the App is uninstalled or permissions are revoked.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">4. Use of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Broslunas CMS is provided "as is" and is intended for managing content in Astro-based projects. You agree not to misuse the service or attempt to bypass any restrictions. We reserve the right to modify, suspend, or discontinue the Service at any time.
          </p>
        </section>

        <section>
           <h2 className="text-xl font-bold mb-4 text-foreground">5. Intellectual Property</h2>
           <p className="text-muted-foreground leading-relaxed">
             The Service and its original content (excluding user-generated content hosted on GitHub), features, and functionality are and will remain the exclusive property of Broslunas and its licensors.
           </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">6. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            In no event shall Broslunas be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">7. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to modify these terms at any time. We will provide notice of any significant changes. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
          </p>
        </section>
      </div>
    </div>
  );
}
