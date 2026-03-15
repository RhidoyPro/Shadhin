import { z } from "zod";

const VALID_STATES = [
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];

export const SignupSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .max(254, "Email too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password too long"),
  firstName: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(100, "Name too long"),
  lastName: z.string().max(100, "Name too long").optional(),
  university: z.string().max(200, "University name too long").optional(),
  dateOfBirth: z
    .date({ message: "Please enter a valid date of birth" })
    .optional(),
  state: z
    .string({ message: "Please select a state" })
    .refine((s) => VALID_STATES.includes(s), {
      message: "Please select a valid Bangladesh district",
    }),
});

export const LoginSchemaWithEmail = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .max(254, "Email too long"),
  password: z.string().min(1, "Please enter a valid password").max(128),
});

export const LoginSchemaWithPhone = z.object({
  phone: z.string().min(1, "Please enter a valid phone number").max(20),
  password: z.string().min(1, "Please enter a valid password").max(128),
});

export const ResetEmailSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .max(254, "Email too long"),
});

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password too long"),
});

export const UpdateProfileSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .max(254, "Email too long"),
  firstName: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(100, "Name too long"),
  lastName: z.string().max(100, "Name too long").optional(),
  university: z.string().max(200, "University name too long").optional(),
  dateOfBirth: z
    .date({ message: "Please enter a valid date of birth" })
    .optional(),
});

export const CommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters"),
});
