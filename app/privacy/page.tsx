import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <Link href="/" className="text-primary hover:underline text-sm mb-8 inline-block">
          &larr; Back to Shadhin.io
        </Link>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              <strong>Account information:</strong> Name, email address, phone number, university, date of birth, and district when you sign up.
            </p>
            <p className="text-muted-foreground">
              <strong>Content:</strong> Posts, comments, messages, and media you upload.
            </p>
            <p className="text-muted-foreground">
              <strong>Usage data:</strong> Pages visited, features used, and interaction patterns via Google Analytics, PostHog, and Microsoft Clarity (consent-gated).
            </p>
            <p className="text-muted-foreground">
              <strong>Device tokens:</strong> Push notification tokens for delivering notifications on web and mobile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to: provide and improve the platform; personalize your feed and recommendations; send notifications and emails; moderate content; and maintain security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Data Storage</h2>
            <p className="text-muted-foreground">
              Your data is stored in MongoDB Atlas (cloud database) and Cloudflare R2 (media files). Passwords are hashed with bcrypt and checked against known breached passwords via the HaveIBeenPwned API. All data is encrypted in transit via HTTPS/TLS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share data with: service providers (database, email, hosting) necessary to operate the platform; and law enforcement when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Your Rights</h2>
            <p className="text-muted-foreground">
              You can: access and update your profile information at any time; delete your account and all associated data from Settings; request a copy of your data by emailing us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Cookies &amp; Tracking</h2>
            <p className="text-muted-foreground mb-3">
              We categorize cookies and tracking technologies into three groups:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Essential:</strong> Authentication, security, and core platform functionality. Always active.</li>
              <li><strong>Analytics (Google Analytics, Microsoft Clarity, PostHog):</strong> Usage statistics, session recordings, engagement patterns, and product improvement.</li>
              <li><strong>Marketing (Meta Pixel):</strong> Personalized advertising on Facebook and Instagram.</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              When you first visit Shadhin.io, a consent banner lets you accept all, reject non-essential, or choose specific categories. You can change your preferences anytime from Settings or the consent banner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Email Communications</h2>
            <p className="text-muted-foreground">
              We send transactional emails (verification, password reset) and optional emails (weekly digest, event reminders, leaderboard updates). You can unsubscribe from optional emails at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Shadhin.io is not intended for children under 13. We do not knowingly collect data from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this policy at any time. We will notify users of significant changes via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">
              For privacy-related questions, contact us at{" "}
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

export default PrivacyPage;
