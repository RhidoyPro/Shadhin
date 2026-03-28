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

const DeleteAccountSection = () => {
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

    toast.success("Account deleted. Goodbye.");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete My Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your account, all your posts, comments,
            likes, and messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-2">
          <p className="text-sm text-muted-foreground mb-2">
            Type <span className="font-bold text-foreground">DELETE</span> to confirm:
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
            {isPending ? "Deleting..." : "Delete Forever"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountSection;
