import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().min(3, "Name must be at least 3 characters long"),
  lastName: z.string().optional(),
  university: z.string().optional(),
  dateOfBirth: z
    .date({
      message: "Please enter a valid date of birth",
    })
    .optional(),
  state: z.string({
    message: "Please select a state",
  }),
});

export const LoginSchemaWithEmail = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter a valid password"),
});

export const LoginSchemaWithPhone = z.object({
  phone: z.string().min(1, "Please enter a valid phone number"),
  password: z.string().min(1, "Please enter a valid password"),
});

export const ResetEmailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const UpdateProfileSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  firstName: z.string().min(3, "Name must be at least 3 characters long"),
  lastName: z.string().optional(),
  university: z.string().optional(),
  dateOfBirth: z
    .date({
      message: "Please enter a valid date of birth",
    })
    .optional(),
  phone: z.string().optional(),
});
