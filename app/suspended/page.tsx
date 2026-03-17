import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import LogoutBtn from "@/components/Shared/LogoutBtn";

const SuspendedPage = async () => {
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
          Account Suspended
        </h1>
        <p className="mb-4 text-muted-foreground">
          Your account has been suspended due to community guideline violations.
        </p>
        {user.suspendedUntil && (
          <p className="mb-4 text-sm text-muted-foreground">
            Suspension expires:{" "}
            <span className="font-medium text-foreground">
              {format(user.suspendedUntil, "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </p>
        )}
        <p className="mb-6 text-sm text-muted-foreground">
          Strikes: {user.strikes}/3. If you believe this is a mistake, contact{" "}
          <span className="font-medium text-primary">support@shadhin.io</span>
        </p>
        <LogoutBtn />
      </div>
    </div>
  );
};

export default SuspendedPage;
