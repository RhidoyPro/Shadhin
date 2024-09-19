"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/components/Shared/Logo";
import BeatLoader from "react-spinners/BeatLoader";
import { useSearchParams } from "next/navigation";
import { newVerification } from "@/actions/verification";
import { toast } from "sonner";

function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  const onSubmit = useCallback(async () => {
    if (!token) return setError("Missing token, please try again");
    newVerification(token)
      .then((data) => {
        setError(data.error);
        setMessage(data.message);
      })
      .catch(() => {
        setError("An error occurred while verifying your email");
      });
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (message) {
      toast.success(message);
    }
  }, [message]);

  return (
    <div className="px-4 h-screen container py-8 flex justify-center items-center flex-col gap-8">
      <Logo />
      <div>
        <Card className="sm:w-[450px] text-center">
          <CardHeader>
            <CardTitle>Verifying your email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-balance text-muted-foreground">
              We are verifying your email address. Please wait for a moment.
            </p>
            {!error && !message && (
              <div className="mt-6">
                <BeatLoader color="#16a34a" />
              </div>
            )}
            {error && <p className="text-red-500 mt-6">{error}</p>}
            {message && <p className="text-green-500 mt-6">{message}</p>}
          </CardContent>
          <CardFooter className="flex items-center justify-center">
            <Button asChild variant={"link"}>
              <Link href="/login">Go back to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
