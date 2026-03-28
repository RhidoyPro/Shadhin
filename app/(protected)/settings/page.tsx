import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import DeleteAccountSection from "@/components/Settings/DeleteAccountSection";
import OrgBadgeSection from "@/components/Settings/OrgBadgeSection";
import CookiePreferencesButton from "@/components/Settings/CookiePreferencesButton";
import { getTranslations, getLocale } from "next-intl/server";
import LanguageSwitcher from "@/components/Settings/LanguageSwitcher";

const SettingsPage = async () => {
  const t = await getTranslations("settings");
  const locale = await getLocale();
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
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

      {/* Password Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {hasPassword ? t("changePassword") : t("setPassword")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {hasPassword
            ? t("changePasswordDesc")
            : t("setPasswordDesc")}
        </p>
        <ChangePasswordForm hasExistingPassword={hasPassword} />
      </div>

      {/* Verified Organisation Badge */}
      {!user.isVerifiedOrg && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {t("orgBadge")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("orgBadgeDesc")}
          </p>
          <OrgBadgeSection />
        </div>
      )}

      {/* Cookie Preferences */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {t("cookiePrefs")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("cookiePrefsDesc")}
        </p>
        <CookiePreferencesButton />
      </div>

      {/* Language */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {t("language")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("languageDesc")}
        </p>
        <LanguageSwitcher currentLocale={locale} />
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-card p-6">
        <h2 className="text-lg font-semibold text-destructive mb-1">
          {t("dangerZone")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("dangerZoneDesc")}
        </p>
        <DeleteAccountSection />
      </div>
    </div>
  );
};

export default SettingsPage;
