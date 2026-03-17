import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <Link href="/" className="text-primary hover:underline text-sm mb-8 inline-block">
          &larr; Back to Shadhin.io
        </Link>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Shadhin.io, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Shadhin.io is a district-based social platform for Bangladesh. Users can post content, attend events, chat, and engage with their local community.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <p className="text-muted-foreground">
              You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 13 years old to use Shadhin.io.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. User Content</h2>
            <p className="text-muted-foreground">
              You retain ownership of content you post. By posting, you grant Shadhin.io a non-exclusive, worldwide license to display and distribute your content on the platform. You agree not to post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Content Moderation</h2>
            <p className="text-muted-foreground">
              We use automated systems and manual review to moderate content. Violations may result in content removal, account strikes, or suspension. Three strikes result in automatic suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Prohibited Conduct</h2>
            <p className="text-muted-foreground">
              You may not: spam or post repetitive content; impersonate others; use bots without authorization; harass other users; attempt to access accounts that are not yours; or use the platform for any illegal purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your account at any time for violation of these terms. You may delete your account at any time from Settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Disclaimer</h2>
            <p className="text-muted-foreground">
              Shadhin.io is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee uninterrupted or error-free service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, contact us at{" "}
              <a href="mailto:help@shadhin.io" className="text-primary hover:underline">
                help@shadhin.io
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
