
"use server";

import * as z from "zod";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import type { AdminRole as AppAdminRole } from "@/types"; 
import { ADMIN_ROLES } from "@/types";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
// Removed redirect from 'next/navigation' as it's no longer called directly here

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SALT_ROUNDS = 10;
const FIXED_CONFIRMATION_STRING = "Dhruv the great";

let jwtSecretKey: string | null = null;

function getJwtSecretKey() {
  if (jwtSecretKey) return jwtSecretKey;
  const keyFromEnv = process.env.JWT_SECRET_KEY;
  if (!keyFromEnv || keyFromEnv.trim() === "") {
    console.error("CRITICAL: JWT_SECRET_KEY is not set. This will cause errors.");
    throw new Error("JWT_SECRET_KEY is not configured on the server.");
  }
  jwtSecretKey = keyFromEnv;
  return jwtSecretKey;
}

async function encrypt(payload: any) {
  const secret = getJwtSecretKey();
  const key = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") 
    .sign(key);
}


export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; error?: string }> {
  console.log("[LoginAction] Started. Input credentials (password redacted):", { email: credentials.email, password: '***' });

  const parsedCredentials = loginSchema.safeParse(credentials);

  if (!parsedCredentials.success) {
    console.error("[LoginAction] Validation failed:", parsedCredentials.error.issues);
    return { success: false, error: "Invalid input format for email or password." };
  } 

  const { email, password } = parsedCredentials.data;
  const lowercasedEmail = email.toLowerCase();
  console.log(`[LoginAction] Attempting to find user. Input email: "${email}", Lowercased email for DB query: "${lowercasedEmail}"`);


  try {
    if (!process.env.DATABASE_URL) {
        console.error("[LoginAction] DATABASE_URL is not set.");
        return { success: false, error: "Database connection is not configured." };
    }

    const adminUserRecord = await prisma.adminUser.findUnique({
      where: { email: lowercasedEmail },
    });

    if (!adminUserRecord) {
      console.log(`[LoginAction] Prisma query for email "${lowercasedEmail}" returned no user. Please verify this email exists (lowercase) in your AdminUser table and that DATABASE_URL is correct.`);
      return { success: false, error: `Admin user with email "${lowercasedEmail}" not found. Please double-check your email or contact support if the issue persists.` };
    }
    console.log(`[LoginAction] User record found for "${lowercasedEmail}":`, { id: adminUserRecord.id, email: adminUserRecord.email, role: adminUserRecord.role });

    console.log(`[LoginAction] Comparing provided password with stored hash for user: "${lowercasedEmail}".`);
    const passwordMatch = bcryptjs.compareSync(password, adminUserRecord.passwordHash);

    if (!passwordMatch) {
      console.log(`[LoginAction] Password mismatch for user: "${lowercasedEmail}"`);
      return { success: false, error: "Invalid email or password." };
    }
    console.log(`[LoginAction] Password match successful for user: "${lowercasedEmail}"`);

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    const sessionRole: AppAdminRole = adminUserRecord.role as unknown as AppAdminRole;

    const sessionPayload = {
      userId: adminUserRecord.id, 
      email: adminUserRecord.email, 
      role: sessionRole,
    };

    const sessionToken = await encrypt(sessionPayload);
    console.log(`[LoginAction] Session token created for user: "${lowercasedEmail}"`);

    const cookieOptions = {
      name: "admin_session",
      value: sessionToken,
      expires,
      maxAge: 24 * 60 * 60, 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const 
    };

    cookies().set(cookieOptions);
    console.log(`[LoginAction] Admin session cookie set with options:`, {
        name: cookieOptions.name,
        expires: cookieOptions.expires.toISOString(),
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        path: cookieOptions.path,
        sameSite: cookieOptions.sameSite
    });
    console.log(`[LoginAction] Session payload for cookie:`, sessionPayload);
    
    // Return success instead of redirecting here
    return { success: true };

  } catch (error: any) {
    console.error("[LoginAction] Error during login process:", error);
    // If it's a redirect error (should not happen now), re-throw it
    if (error.message === 'NEXT_REDIRECT' || (error.digest && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT'))) {
      // This block should ideally not be reached if redirect() is not called.
      console.error("[LoginAction] Caught a NEXT_REDIRECT error unexpectedly. This should not happen if redirect() is removed from this action.");
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return { success: false, error: `An unexpected error occurred during login: ${errorMessage}` };
  }
}

export async function resetPasswordAction(credentials: any): Promise<{ success: boolean; error?: string; message?: string }> {
  console.log("[ResetPasswordAction] Started. Input credentials (password redacted):", { email: credentials.email, newPassword: '***' });

  const { email, confirmationString, newPassword } = credentials;

  if (confirmationString !== FIXED_CONFIRMATION_STRING) {
    console.log("[ResetPasswordAction] Invalid confirmation string.");
    return { success: false, error: "Invalid confirmation string." };
  }

  const lowercasedEmail = email.toLowerCase();
  console.log(`[ResetPasswordAction] Attempting to find user for password reset. Input email: "${email}", Lowercased email for DB query: "${lowercasedEmail}"`);

  try {
    if (!process.env.DATABASE_URL) {
        console.error("[ResetPasswordAction] DATABASE_URL is not set.");
        return { success: false, error: "Database connection is not configured." };
    }
    const adminUserRecord = await prisma.adminUser.findUnique({
      where: { email: lowercasedEmail },
    });

    if (!adminUserRecord) {
      console.log(`[ResetPasswordAction] Prisma query for email "${lowercasedEmail}" returned no user for password reset. Check DB & DATABASE_URL.`);
      return { success: false, error: `Admin user with email "${lowercasedEmail}" not found. Cannot reset password.` };
    }
    console.log(`[ResetPasswordAction] User record found for "${lowercasedEmail}".`);

    const newPasswordHash = await bcryptjs.hash(newPassword, SALT_ROUNDS);
    console.log(`[ResetPasswordAction] New password hashed for "${lowercasedEmail}".`);

    await prisma.adminUser.update({
      where: { id: adminUserRecord.id },
      data: { passwordHash: newPasswordHash },
    });
    console.log(`[ResetPasswordAction] Password updated in database for "${lowercasedEmail}".`);

    return { success: true, message: "Password has been reset successfully. You can now login with your new password." };

  } catch (error: any) {
    console.error("[ResetPasswordAction] Error during password reset:", error);
     if (error.message === 'NEXT_REDIRECT' || (error.digest && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT'))) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
    return { success: false, error: `An unexpected error occurred during password reset: ${errorMessage}` };
  }
}

// Import redirect for logoutAction
import { redirect } from 'next/navigation';

export async function logoutAction() {
  cookies().delete("admin_session");
  console.log("[LogoutAction] Admin session cookie deleted.");
  redirect("/admin/login"); // Server-side redirect for logout
}
