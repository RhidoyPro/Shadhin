import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect(DEFAULT_LOGIN_REDIRECT);
  }

  return (
    <main className="bg-slate-100 dark:bg-neutral-700">
      <Navbar />
    </main>
  );
}
