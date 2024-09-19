import { UserRole } from "@prisma/client";
import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    userId: string;
  }
}
