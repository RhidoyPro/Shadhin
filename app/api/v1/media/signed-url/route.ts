import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/quicktime",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-media:${user.userId}`, { limit: 5, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.fileType || !body?.fileSize || !body?.checkSum) {
    return NextResponse.json({ error: "fileType, fileSize, and checkSum are required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(body.fileType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  if (body.fileSize > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const key = crypto.randomBytes(32).toString("hex");

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: body.fileType,
    ContentLength: body.fileSize,
    Metadata: { userId: user.userId },
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 });

  return NextResponse.json({
    url,
    publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
  });
}
