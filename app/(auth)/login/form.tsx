"use client";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Shared/Logo";
import { login, loginWithCreds } from "@/actions/auth";
import { useFormState, useFormStatus } from "react-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/ui/phone-input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isValidPhoneNumber } from "react-phone-number-input";
import { LoginSchemaWithEmail, LoginSchemaWithPhone } from "@/utils/zodSchema";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <ClipLoader size={14} color="#fff" className="mr-1" />}
      {pending ? "Logging in" : "Login"}
    </Button>
  );
}

const LoginForm = () => {
  const [state, formAction] = useFormState(loginWithCreds, null);
  const [isLoginWithPhone, setIsLoginWithPhone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state) return;
    if (state.message) {
      setMessage(state.message);
      toast.success(state.message);
    }
    if (state.error) {
      setError(state.error);
      toast.error(state.error);
    }
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    setMessage("");
    setError("");
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      loginWithPhone: isLoginWithPhone,
    };

    if (isLoginWithPhone) {
      if (!isValidPhoneNumber(data.phone)) {
        toast.error("Please enter a valid phone number");
        return;
      }

      const validatedData = LoginSchemaWithPhone.safeParse(data);

      if (!validatedData.success) {
        const errors = validatedData.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0][0] || "Invalid input";
        toast.error(firstError);
        return;
      }

      formAction(data);
      return;
    }

    const validatedData = LoginSchemaWithEmail.safeParse(data);

    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0][0] || "Invalid input";
      toast.error(firstError);
      return;
    }

    formAction(data);
  };

  return (
    <form action={handleSubmit} className="mx-auto grid sm:w-[400px] gap-6">
      <div className="mx-auto">
        <Logo color="white" />
      </div>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold text-white">Login</h1>
        <p className="text-balance text-slate-200">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-4">
        {!isLoginWithPhone && (
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
        )}
        {isLoginWithPhone && (
          <div className="grid gap-2">
            <Label htmlFor="phone" className="text-white">
              Phone Number
            </Label>
            <PhoneInput
              placeholder="Enter number"
              defaultCountry="BD"
              international
              id="phone"
              name="phone"
            />
          </div>
        )}
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="ml-auto inline-block text-sm underline text-white"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isLoginWithPhone}
            onCheckedChange={setIsLoginWithPhone}
            id="loginWithPhone"
            name="loginWithPhone"
            value={isLoginWithPhone ? "true" : "false"}
          />
          <Label htmlFor="loginWithPhone" className="text-white">
            {isLoginWithPhone
              ? "Login with Email instead"
              : "Login with Phone instead"}
          </Label>
        </div>
        {message && <p className="text-green-500">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}
        <SubmitButton />
        {/* <Button
          variant="outline"
          className="w-full text-black dark:text-white"
          onClick={() => {
            track("login_google");
            login("google");
          }}
          type="button"
        >
          <Image
            src={"/google.svg"}
            width={20}
            height={20}
            alt="Google"
            className="mr-2"
          />
          Login with Google
        </Button> */}
      </div>
      <div className="text-center text-sm text-white">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
