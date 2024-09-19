import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";

// Define a schema for the incoming request
const SignupUserSchema = z.object({
  email: z
    .string({
      message: "Email is required",
    })
    .email({ message: "Please enter a valid email" }),
  name: z
    .string({
      message: "Name is required",
    })
    .min(3, { message: "Name must be at least 3 characters long" }),
  password: z
    .string({
      message: "Password is required",
    })
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export async function POST(req: Request) {
  try {
    // Validate the request body against the schema
    const { email, name, password } = await req.json();

    const validatedData = SignupUserSchema.safeParse({ email, name, password });

    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0][0] || "Invalid input";
      return new NextResponse(firstError, { status: 400 });
    }

    // // Create and save a user on the database
    // const user = await db.user.create({
    //   data: {
    //     email,
    //     name,
    //     hashedPassword: password,
    //   },
    // });
    const user = {};

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.log("[SIGNUP USER]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
