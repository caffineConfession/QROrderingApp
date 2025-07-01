'use server';

import { z } from "zod";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { encryptSession } from '@/lib/session';
import type { AdminRole } from "@/types";
import { ResetPasswordSchema, type ResetPasswordFormData } from "./schemas";
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; error?: string; }> {
  console.log("[LoginAction] Attempting login for:", credentials.email);
  
  const parsedCredentials = loginSchema.safeParse(credentials);
  if (!parsedCredentials.success) {
    const errorMessages = parsedCredentials.error.issues.map(issue => issue.message).join(", ");
    console.error("[LoginAction] Validation failed:", errorMessages);
    return { success: false, error: `Invalid input: ${errorMessages}` };
  }
  
  const { email, password } = parsedCredentials.data;
  const lowercasedEmail = email.toLowerCase();

  try {
    if (!process.env.DATABASE_URL) {
        console.error("[LoginAction] DATABASE_URL is not set.");
        return { success: false, error: "Database connection is not configured." };
    }

    const adminUserRecord = await prisma.adminUser.findUnique({
      where: { email: lowercasedEmail },
    });

    if (!adminUserRecord) {
      console.log(`[LoginAction] Admin user with email "${lowercasedEmail}" not found.`);
      return { success: false, error: "Invalid email or password." };
    }

    const passwordMatch = await bcryptjs.compare(password, adminUserRecord.passwordHash);

    if (!passwordMatch) {
      console.log(`[LoginAction] Password mismatch for user "${lowercasedEmail}".`);
      return { success: false, error: "Invalid email or password." };
    }
    console.log(`[LoginAction] User "${lowercasedEmail}" authenticated successfully.`);

    const sessionRole: AdminRole = adminUserRecord.role as AdminRole;
    const sessionPayload = {
      userId: adminUserRecord.id,
      email: adminUserRecord.email,
      role: sessionRole,
    };
    const sessionToken = await encryptSession(sessionPayload);
    console.log(`[LoginAction] Session token generated. Redirecting to verification path.`);
    
    redirect(`/admin/login/verify?token=${sessionToken}`);

  } catch (error: any) {
    if (error.constructor.name === 'RedirectError') {
      console.log("[LoginAction] Caught NEXT_REDIRECT, re-throwing.");
      throw error;
    }
    const errorMessage = error.message || "An unknown error occurred during login process.";
    const errorName = error.name || "UnknownError";
    console.error(`[LoginAction] GENERAL ERROR: Name: ${errorName}, Message: ${errorMessage}`, error.stack);
    return { success: false, error: `Server error: ${errorMessage}` };
  }
}

export async function logoutAction(): Promise<void> {
  console.log("[LogoutAction] Initiating logout. Redirecting to clear session.");
  redirect('/admin/logout');
}

const FIXED_CONFIRMATION_STRING = "Dhruv the great";
const SALT_ROUNDS = 10;

export async function resetPasswordAction(credentials: ResetPasswordFormData): Promise<{ success: boolean; error?: string; message?: string }> {
  console.log("[ResetPasswordAction] Started for email:", credentials.email);
  try {
    const validationResult = ResetPasswordSchema.safeParse(credentials);
    if (!validationResult.success) {
      return { success: false, error: "Invalid input format for reset password." };
    }

    const { email, confirmationString, newPassword } = validationResult.data;

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
