import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = auth(function GET(req) {
  if (!req.auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    id: req.auth.user?.id,
    role: req.auth.user?.role,
  });
});
