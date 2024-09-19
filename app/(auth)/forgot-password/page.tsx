"use client";
import React, { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/components/Shared/Logo";
import BeatLoader from "react-spinners/BeatLoader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ResetEmailSchema } from "@/utils/zodSchema";
import {
  forgotPassword,
  sendForgotPasswordCode,
} from "@/actions/forgot-password";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function ForgotPasswordPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isCodeShown, setIsCodeShown] = useState(false);
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = (e.currentTarget.email as HTMLInputElement).value;

    const validatedEmail = ResetEmailSchema.safeParse({ email });

    if (!validatedEmail.success) {
      toast.error(validatedEmail.error.errors[0].message || "Invalid email");
      return;
    }

    startTransition(() => {
      sendForgotPasswordCode(email)
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          if (data.message) {
            setIsCodeShown(true);
            toast.success(data.message);
            return;
          }
        })
        .catch((error) => {
          toast.error(error);
        });
    });
  };

  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const password =
      (e.currentTarget.password as HTMLInputElement)?.value || "";

    startTransition(() => {
      forgotPassword(code, password, isPasswordShown)
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          if (data.message) {
            toast.success(data.message);
            if (data.resetSuccess) {
              router.push("/login");
            }
            return;
          }
          if (data.showSetPassword) {
            setIsPasswordShown(true);
            setIsCodeShown(false);
            return;
          }
        })
        .catch((error) => {
          toast.error(error || "An error occurred");
        });
    });
  };

  return (
    <div className="px-4 h-screen container py-8 flex justify-center items-center flex-col gap-8">
      <Logo />
      <div>
        <Card className="sm:w-[450px] text-center">
          <CardHeader>
            <CardTitle>Reset your Password</CardTitle>
          </CardHeader>
          <CardDescription>
            {!isCodeShown && !isPasswordShown
              ? "Enter your email address to receive a reset code."
              : isCodeShown
              ? "Enter the code sent to your email to verify your account."
              : "Enter your new password to reset your account."}
          </CardDescription>
          <CardContent>
            {!isCodeShown && !isPasswordShown && (
              <form
                onSubmit={handleSubmit}
                className="grid gap-4 text-left mt-6"
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isPending}
                />

                <Button type="submit" disabled={isPending}>
                  {isPending ? <BeatLoader color="#fff" /> : "Send Reset Code"}
                </Button>
              </form>
            )}
            {(isCodeShown || isPasswordShown) && (
              <form
                onSubmit={handleResetPassword}
                className="grid gap-4 text-left mt-6"
              >
                {isCodeShown && (
                  <div className="flex items-center justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={(value) => setCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}
                {isPasswordShown && (
                  <>
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="********"
                      required
                      disabled={isPending}
                    />
                  </>
                )}

                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <BeatLoader color="#fff" />
                  ) : isCodeShown ? (
                    "Verify Code"
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
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

export default ForgotPasswordPage;
