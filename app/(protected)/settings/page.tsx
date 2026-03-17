import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import DeleteAccountSection from "@/components/Settings/DeleteAccountSection";

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
