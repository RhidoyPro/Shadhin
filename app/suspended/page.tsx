import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import LogoutBtn from "@/components/Shared/LogoutBtn";
import { getTranslations } from "next-intl/server";

const SuspendedPage = async () => {
  const t = await getTranslations("suspended");
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check actual DB state (session may be stale)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isSuspended: true, suspendedUntil: true, strikes: true },
  });

  if (!user?.isSuspended) {
    redirect("/events/all-districts");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-3xl">&#9888;</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="mb-4 text-muted-foreground">
          {t("description")}
        </p>
        {user.suspendedUntil && (
          <p className="mb-4 text-sm text-muted-foreground">
            {t("expiresAt")}{" "}
            <span className="font-medium text-foreground">
              {format(user.suspendedUntil, "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </p>
        )}
        <p className="mb-6 text-sm text-muted-foreground">
          {t("strikes", { strikes: user.strikes })}
        </p>
        <LogoutBtn />
      </div>
    </div>
  );
};

export default SuspendedPage;
