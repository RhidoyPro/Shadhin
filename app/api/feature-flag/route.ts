import { auth } from "@/auth";
import { evaluateFlag } from "@/lib/feature-flags";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ variant: "control", enabled: false });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json(
      { error: "Missing key parameter" },
      { status: 400 }
    );
  }

  const result = await evaluateFlag(session.user.id, key);
  return NextResponse.json(result);
}
