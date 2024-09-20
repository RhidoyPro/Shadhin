import Image from "next/image";
import LoginForm from "./form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(DEFAULT_LOGIN_REDIRECT);
  }
  return (
    <div className="w-full grid lg:grid-cols-2 min-h-screen">
      <div className="flex items-center justify-center py-12 px-4">
        <LoginForm />
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="/bangladesh.jpg"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
