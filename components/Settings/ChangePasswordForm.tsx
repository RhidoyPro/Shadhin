"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { changePassword } from "@/actions/settings";
import { useTranslations } from "@/components/I18nProvider";

interface ChangePasswordFormProps {
  hasExistingPassword: boolean;
}

const ChangePasswordForm = ({ hasExistingPassword }: ChangePasswordFormProps) => {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast.error(t("passwordsMismatch"));
      setIsPending(false);
      return;
    }

    const res = await changePassword(
      hasExistingPassword ? currentPassword : undefined,
      newPassword
    );

    if (res.error) {
      toast.error(res.error);
      setIsPending(false);
      return;
    }

    toast.success(res.message);

    if (res.requireRelogin) {
      // Force re-login so the new password takes effect for credential sessions
      await signOut({ callbackUrl: "/login" });
      return;
    }
    setIsPending(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {hasExistingPassword && (
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            placeholder={t("currentPasswordPlaceholder")}
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="newPassword">{t("newPassword")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder={t("newPasswordHint")}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          placeholder={t("confirmPasswordPlaceholder")}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? tc("saving") : hasExistingPassword ? t("changePassword") : t("setPassword")}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
