
"use server";

import * as z from "zod";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import type { AdminRole as AppAdminRole } from "@/types";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { redirect } from 'next/navigation'; // Ensure redirect is imported

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SALT_ROUNDS = 10; 
const FIXED_CONFIRMATION_STRING = "Dhruv the great"; 

let jwtSecretKeyInstance: string | null = null;

function getJwtSecretKey(): string {
  if (jwtSecretKeyInstance) return jwtSecretKeyInstance;
  const keyFromEnv = process.env.JWT_SECRET_KEY;
  if (!keyFromEnv || keyFromEnv.trim() === "") {
    console.error("CRITICAL: JWT_SECRET_KEY is not set in loginAction. This will cause errors.");
    // Fallback only for extreme dev cases - SHOULD BE SET IN .env
    jwtSecretKeyInstance = "fallback-secret-for-dev-only-if-not-set"; 
    if (jwtSecretKeyInstance === "fallback-secret-for-dev-only-if-not-set") {
      console.warn("Warning: Using fallback JWT_SECRET_KEY. This is insecure.");
    }
  } else {
    jwtSecretKeyInstance = keyFromEnv;
  }
  return jwtSecretKeyInstance;
}

async function encrypt(payload: any) {
  const secret = getJwtSecretKey();
  if (!secret || secret === "fallback-secret-for-dev-only-if-not-set") {
    throw new Error("JWT_SECRET_KEY is not properly configured for session encryption.");
  }
  const key = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(key);
}

export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; error?: string } | void> {
  console.log("[LoginAction] Attempting login for:", credentials.email);
  try {
    const parsedCredentials = loginSchema.safeParse(credentials);
    if (!parsedCredentials.success) {
      console.error("[LoginAction] Validation failed:", parsedCredentials.error.issues);
      return { success: false, error: "Invalid input format for email or password." };
    }
    const { email, password } = parsedCredentials.data;
    const lowercasedEmail = email.toLowerCase();
    
    if (!process.env.DATABASE_URL) {
        console.error("[LoginAction] DATABASE_URL is not set.");
        return { success: false, error: "Database connection is not configured." };
    }

    const adminUserRecord = await prisma.adminUser.findUnique({
      where: { email: lowercasedEmail },
    });

    if (!adminUserRecord) {
      return { success: false, error: `Admin user with email "${lowercasedEmail}" not found.` };
    }

    const passwordMatch = bcryptjs.compareSync(password, adminUserRecord.passwordHash);

    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password." };
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sessionRole: AppAdminRole = adminUserRecord.role as AppAdminRole; 

    const sessionPayload = {
      userId: adminUserRecord.id,
      email: adminUserRecord.email,
      role: sessionRole,
    };

    const sessionToken = await encrypt(sessionPayload);
    console.log(`[LoginAction] Session token created for user: "${lowercasedEmail}"`);

    cookies().set({
      name: "admin_session",
      value: sessionToken,
      expires,
      maxAge: 24 * 60 * 60, // 1 day in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const
    });
    console.log("[LoginAction] Admin session cookie set.");
    
    // Perform server-side redirect. This will throw a NEXT_REDIRECT error.
    redirect('/admin/dashboard'); 
    // Code below redirect() will not be executed if redirect happens.

  } catch (error: any) {
    // If the error is NEXT_REDIRECT, re-throw it so Next.js can handle it.
    if (error.digest?.includes('NEXT_REDIRECT')) {
      console.log("[LoginAction] Caught NEXT_REDIRECT, re-throwing.");
      throw error;
    }
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("[LoginAction] CRITICAL ERROR during login processing:", error);
    return { success: false, error: `Server error during login: ${errorMessage}` };
  }
}

export async function logoutAction(): Promise<void> {
  console.log("[LogoutAction] Deleting admin_session cookie.");
  cookies().delete("admin_session");
  redirect('/admin/login'); // Perform server-side redirect
}

export async function resetPasswordAction(credentials: any): Promise<{ success: boolean; error?: string; message?: string }> {
  console.log("[ResetPasswordAction] Started for email:", credentials.email);
  try {
    // getJwtSecretKey(); // Ensure key is checked, called by encrypt if that were used here.

    const { email, confirmationString, newPassword } = credentials;

    if (confirmationString !== FIXED_CONFIRMATION_STRING) {
      return { success: false, error: "Invalid confirmation string." };
    }

    const lowercasedEmail = email.toLowerCase();
    console.log(`[ResetPasswordAction] Querying DB for: ${lowercasedEmail}`);

    if (!process.env.DATABASE_URL) {
        console.error("[ResetPasswordAction] DATABASE_URL is not set.");
        return { success: false, error: "Database connection is not configured." };
    }
    const adminUserRecord = await prisma.adminUser.findUnique({
      where: { email: lowercasedEmail },
    });

    if (!adminUserRecord) {
      return { success: false, error: `Admin user with email "${lowercasedEmail}" not found.` };
    }

    const newPasswordHash = await bcryptjs.hash(newPassword, SALT_ROUNDS);
    console.log(`[ResetPasswordAction] New password hashed for "${lowercasedEmail}".`);

    await prisma.adminUser.update({
      where: { id: adminUserRecord.id },
      data: { passwordHash: newPasswordHash },
    });
    console.log(`[ResetPasswordAction] Password updated in database for "${lowercasedEmail}".`);

    return { success: true, message: "Password has been reset successfully. You can now login with your new password." };

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
     console.error("[ResetPasswordAction] CRITICAL ERROR during password reset:", {
        message: errorMessage,
        name: error.name,
        stack: error.stack,
        errorObjectString: String(error)
    });
    return { success: false, error: `Server error during password reset: ${errorMessage}` };
  }
}
