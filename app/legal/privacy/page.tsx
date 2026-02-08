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
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            At Broslunas CMS ("we", "our", or "the Company"), we respect your privacy and are committed to protecting it through compliance with this policy.
            This policy describes the types of information we may collect from you or that you may provide when you visit the website broslunas.com (our "Website") and our practices for collecting, using, maintaining, protecting, and disclosing that information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We collect several types of information from and about users of our Website, including information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>By which you may be personally identified, such as name, postal address, e-mail address, telephone number ("personal information").</li>
            <li>About your internet connection, the equipment you use to access our Website, and usage details.</li>
            <li>Repository Information: To provide our service, we access GitHub repositories based on the permissions you grant. We do not store the content of your repositories, only necessary metadata.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use the information we collect about you or that you provide to us, including any personal information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>To present our Website and its contents to you.</li>
            <li>To provide you with information, products, or services that you request from us.</li>
            <li>To fulfill any other purpose for which you provide it.</li>
            <li>To notify you about changes to our Website or any products or services we offer or provide through it.</li>
            <li>To improve our Website and deliver a better and more personalized experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on our secure servers behind firewalls.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@broslunas.com
          </p>
        </section>
      </div>
    </div>
  );
}
