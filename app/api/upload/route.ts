import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const userId = formData.get("userId") as string | null;

  if (!file || !userId) {
    return NextResponse.json({ error: "File and userId required" }, { status: 400 });
  }

  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = crypto.randomBytes(32).toString("hex");
    const Key = `profile-images/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key,
        Body: buffer,
        ContentType: file.type,
        Metadata: { userId },
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${Key}`;

    await db.user.update({
      where: { id: userId },
      data: { image: publicUrl },
    });

    revalidatePath("/user/[userId]", "page");

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Profile image upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
