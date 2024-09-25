"use client";
import React from "react";

import { Button } from "@/components/ui/button";
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
import { sendReVerificationEmailsByAdmin } from "@/actions/verification";
import { toast } from "sonner";

const ResendVerificationEmail = () => {
  const sendVerificationEmailHandler = async () => {
    const sendReVerificationEmailsResponse =
      await sendReVerificationEmailsByAdmin();
    if (sendReVerificationEmailsResponse.error !== undefined) {
      return toast.error(sendReVerificationEmailsResponse.error);
    }

    toast.success("Verification emails sent successfully");
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Send Verification Emails</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to send verification emails to all users?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will resend the verification emails to all the users whoom have
            not verified their email, or their verification was pending
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={sendVerificationEmailHandler}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResendVerificationEmail;
