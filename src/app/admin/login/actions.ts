
"use server";

import * as z from "zod";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import type { AdminRole as AppAdminRole } from "@/types"; // Using AppAdminRole from types
import { ADMIN_ROLES } from "@/types";
import prisma from "@/lib/prisma";
import bcryptjs from 'bcryptjs';
import type { AdminRole as PrismaAdminRole } from "@prisma/client";


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ResetPasswordSchemaInternal and ResetPasswordFormDataInternal are defined in page.tsx

// Ensure JWT_SECRET_KEY is set in your environment variables
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET_KEY || JWT_SECRET_KEY.trim() === "") {
  throw new Error("JWT_SECRET_KEY is not set or is empty in environment variables. Please generate a strong secret key using 'openssl rand -base64 32' and set it in your .env file.");
}

const key = new TextEncoder().encode(JWT_SECRET_KEY);
const SALT_ROUNDS = 10;
const FIXED_CONFIRMATION_STRING = "Dhruv the great";

async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // Token expires in 1 day
    .sign(key);
}


export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; role?: AppAdminRole; error?: string }> {
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

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const sessionRole: AppAdminRole = adminUserRecord.role as unknown as AppAdminRole;

    const sessionPayload = {
      userId: adminUserRecord.email,
      email: sessionRole === ADMIN_ROLES.BUSINESS_MANAGER ? adminUserRecord.email : undefined,
      role: sessionRole,
    };

    const session = await encrypt(sessionPayload);
    console.log(`[LoginAction] Session created for user: "${lowercasedEmail}"`);

    (await cookies()).set("admin_session", session, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
    return { success: true, role: sessionRole };

  } catch (error) {
    console.error("[LoginAction] Error during login process:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
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

  } catch (error) {
    console.error("[ResetPasswordAction] Error during password reset:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
    return { success: false, error: `An unexpected error occurred during password reset: ${errorMessage}` };
  }
}


export async function logoutAction() {
  (await cookies()).delete("admin_session");
  console.log("[LogoutAction] Admin session cookie deleted.");
}
