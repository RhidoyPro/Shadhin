"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { changePassword } from "@/actions/settings";

interface ChangePasswordFormProps {
  hasExistingPassword: boolean;
}

const ChangePasswordForm = ({ hasExistingPassword }: ChangePasswordFormProps) => {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsPending(false);
      return;
    }

    const res = await changePassword(
      hasExistingPassword ? currentPassword : undefined,
      newPassword
    );

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message);
    }
    setIsPending(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {hasExistingPassword && (
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            placeholder="Enter current password"
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          placeholder="Confirm new password"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : hasExistingPassword ? "Change Password" : "Set Password"}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
