import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read how Broslunas CMS handles and protects your data and privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: February 6, 2026</p>
      
      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">1. Data Collection</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We collect information primarily to provide and improve our Service. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>GitHub Account Information:</strong> When you sign in with GitHub, we collect your GitHub user ID, username, email address, and profile picture.</li>
            <li><strong>Repository Data:</strong> We access your repositories solely to enable content management features. We do not store your repository content on our servers; it remains on GitHub. We only store metadata necessary for the operation of the CMS.</li>
            <li><strong>Usage Data:</strong> We use Google Analytics to collect anonymous information about how you use the website (e.g., pages visited, time spent) to help us improve the user experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">2. How We Use Your Data</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your data is used for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Authentication:</strong> To verify your identity and manage your session using NextAuth.js.</li>
            <li><strong>Service Functionality:</strong> To allow you to view, edit, and manage your Astro content collections directly within the CMS.</li>
            <li><strong>App Verification:</strong> We periodically check the installation status of our GitHub App on your account to ensure you have the necessary permissions.</li>
            <li><strong>Communication:</strong> We may use your email to send important updates regarding the Service.</li>
          </ul>
        </section>

        <section>
           <h2 className="text-xl font-bold mb-4 text-foreground">3. Data Storage & Security</h2>
           <p className="text-muted-foreground leading-relaxed">
             We use MongoDB to store user session data and application preferences. We prioritize the security of your data and implement industry-standard measures to protect it. However, no method of transmission over the Internet is 100% secure.
           </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">4. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            We share data with trusted third-party services only as necessary for the operation of the Service:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
            <li><strong>GitHub:</strong> For authentication and repository data access.</li>
            <li><strong>Google Analytics:</strong> For analyzing website traffic and usage patterns.</li>
            <li><strong>Vercel / AWS:</strong> For hosting and infrastructure (if applicable).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">5. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal information. You can revoke our access to your GitHub account at any time via your GitHub settings. To request deletion of your data from our systems, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-foreground">6. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at privacy@broslunas.com.
          </p>
        </section>
      </div>
    </div>
  );
}
