
"use server";

import * as z from "zod";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import type { AdminRole } from "@/types";
import { ADMIN_ROLES } from "@/types"; // Keep this for type safety if needed, or use AdminRole from Prisma
import prisma from "@/lib/prisma";
import bcryptjs from 'bcryptjs';
import type { AdminRole as PrismaAdminRole } from "@prisma/client";


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Ensure JWT_SECRET_KEY is set in your environment variables
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET_KEY || JWT_SECRET_KEY.trim() === "") {
  throw new Error("JWT_SECRET_KEY is not set or is empty in environment variables. Please generate a strong secret key using 'openssl rand -base64 32' and set it in your .env file.");
}

const key = new TextEncoder().encode(JWT_SECRET_KEY);

async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // Token expires in 1 day
    .sign(key);
}


export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; role?: AdminRole; error?: string }> {
  const parsedCredentials = loginSchema.safeParse(credentials);

  if (!parsedCredentials.success) {
    return { success: false, error: "Invalid input." };
  }

  const { email, password } = parsedCredentials.data;

  try {
    const adminUserRecord = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!adminUserRecord) {
      return { success: false, error: "Invalid email or password." };
    }

    const passwordMatch = bcryptjs.compareSync(password, adminUserRecord.passwordHash);

    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password." };
    }

    // Successfully authenticated
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    
    // The role from Prisma is PrismaAdminRole, ensure it's compatible with AdminRole from @/types
    const sessionRole: AdminRole = adminUserRecord.role as unknown as AdminRole;

    const sessionPayload = {
      // Using adminUserRecord.email as userId for now for compatibility with existing order takenBy/processedBy logic
      // Ideally, this would be adminUserRecord.id (the CUID)
      userId: adminUserRecord.email, 
      email: sessionRole === ADMIN_ROLES.BUSINESS_MANAGER ? adminUserRecord.email : undefined,
      role: sessionRole,
    };
    
    const session = await encrypt(sessionPayload);

    cookies().set("admin_session", session, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
    return { success: true, role: sessionRole };

  } catch (error) {
    console.error("Login action error:", error);
    return { success: false, error: "An unexpected error occurred during login." };
  }
}

export async function logoutAction() {
  cookies().delete("admin_session");
}
