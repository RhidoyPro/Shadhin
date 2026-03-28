import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import DeleteAccountSection from "@/components/Settings/DeleteAccountSection";
import OrgBadgeSection from "@/components/Settings/OrgBadgeSection";
import CookiePreferencesButton from "@/components/Settings/CookiePreferencesButton";

const SettingsPage = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      hashedPassword: true,
      isVerifiedOrg: true,
    },
  });

  if (!user) redirect("/login");

  const hasPassword = !!user.hashedPassword;

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Password Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {hasPassword ? "Change Password" : "Set Password"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {hasPassword
            ? "Update your account password."
            : "You signed up with Google. Set a password to also log in with email."}
        </p>
        <ChangePasswordForm hasExistingPassword={hasPassword} />
      </div>

      {/* Verified Organisation Badge */}
      {!user.isVerifiedOrg && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Verified Organisation Badge
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Apply for a verified badge to show your organisation&apos;s authenticity on Shadhin.io. One-time fee of ৳300 via bKash.
          </p>
          <OrgBadgeSection />
        </div>
      )}

      {/* Cookie Preferences */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Cookie Preferences
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage which analytics and marketing cookies you allow.
        </p>
        <CookiePreferencesButton />
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-card p-6">
        <h2 className="text-lg font-semibold text-destructive mb-1">
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <DeleteAccountSection />
      </div>
    </div>
  );
};

export default SettingsPage;
