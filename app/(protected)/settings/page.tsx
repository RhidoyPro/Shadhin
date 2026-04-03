import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import DeleteAccountSection from "@/components/Settings/DeleteAccountSection";
import OrgBadgeSection from "@/components/Settings/OrgBadgeSection";
import CookiePreferencesButton from "@/components/Settings/CookiePreferencesButton";
import { getTranslations, getLocale } from "@/lib/i18n";
import LanguageSwitcher from "@/components/Settings/LanguageSwitcher";

const SettingsPage = async () => {
  const locale = getLocale();
  const t = getTranslations("settings");
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

      {/* Help & Support */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {t("helpSupport")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("helpDescription")}
        </p>
        <div className="space-y-3">
          <a
            href="mailto:help@shadhin.io"
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">help@shadhin.io</p>
              <p className="text-xs text-muted-foreground">{t("helpReplyTime")}</p>
            </div>
          </a>
        </div>
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
