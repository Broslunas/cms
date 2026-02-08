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
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing and using Broslunas CMS ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Broslunas CMS is a content management tool for static websites built with Astro. The Service integrates with GitHub to enable content editing. We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Conduct</h2>
          <p className="text-muted-foreground leading-relaxed">
             You are solely responsible for all code, video, images, information, data, text, software, music, sound, graphics, messages, or other materials ("content") that you upload, post, publish, or display via the Service. You agree not to use the Service for any illegal or unauthorized purpose.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service and its original content, features, and functionality are and will remain the exclusive property of Broslunas and its licensors. The Service is protected by copyright, trademark, and other laws of both Spain and foreign countries.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            In no event shall Broslunas, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms shall be governed and construed in accordance with the laws of Spain, without regard to its conflict of law provisions.
          </p>
        </section>
      </div>
    </div>
  );
}
