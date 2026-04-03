"use client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Shared/Logo";
import { loginWithCreds } from "@/actions/auth";
import { useFormState, useFormStatus } from "react-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoginSchemaWithEmail } from "@/utils/zodSchema";
import { analytics } from "@/utils/analytics";
import { useTranslations } from "@/components/I18nProvider";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("auth");

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <ClipLoader size={14} color="#fff" className="mr-1" />}
      {pending ? t("loggingIn") : t("login")}
    </Button>
  );
}

const LoginForm = () => {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, formAction] = useFormState(loginWithCreds, null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state) return;
    if (state.message) {
      setMessage(state.message);
      toast.success(state.message);
      analytics.login("email");
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
      loginWithPhone: false,
    };

    const validatedData = LoginSchemaWithEmail.safeParse(data);

    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0][0] || tc("invalidInput");
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
        <h1 className="text-3xl font-bold text-white">{t("login")}</h1>
        <p className="text-balance text-slate-200">
          {t("loginDescription")}
        </p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-white">
            {t("email")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password" className="text-white">
              {t("password")}
            </Label>
            <Link
              href="/forgot-password"
              className="ml-auto inline-block text-sm underline text-white"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t("passwordPlaceholder")}
            required
          />
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
        {t("noAccount")}{" "}
        <Link href="/signup" className="underline">
          {t("signUp")}
        </Link>
      </div>
      <div className="text-center text-xs text-white/60">
        <a href="mailto:help@shadhin.io" className="hover:text-white/80 hover:underline transition-colors">
          {t("needHelp", { email: "help@shadhin.io" })}
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
