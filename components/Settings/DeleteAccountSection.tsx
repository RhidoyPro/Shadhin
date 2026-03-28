"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteOwnAccount } from "@/actions/settings";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

const DeleteAccountSection = () => {
  const t = useTranslations("deleteAccount");
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsPending(true);
    const res = await deleteOwnAccount();

    if (res.error) {
      toast.error(res.error);
      setIsPending(false);
      return;
    }

    toast.success(t("goodbye"));
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{t("title")}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("confirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-2">
          <p className="text-sm text-muted-foreground mb-2">
            {t("typeDelete")}
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmation("")}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmation !== "DELETE" || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? t("deleting") : t("deleteForever")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountSection;
