
'use server';

import { z } from "zod";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { encryptSession } from '@/lib/session';
import type { AdminRole } from "@/types";
import { ResetPasswordSchema, type ResetPasswordFormData } from "./schemas"; // Keep schema import

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// Modified loginAction to return token instead of setting cookie directly
export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; error?: string; sessionToken?: string }> {
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
    console.log(`[LoginAction] Session token generated for user: "${lowercasedEmail}"`);
    
    // Return token instead of setting cookie
    return { success: true, sessionToken };

  } catch (error: any) {
    const errorMessage = error.message || "An unknown error occurred during login process.";
    const errorName = error.name || "UnknownError";
    console.error(`[LoginAction] GENERAL ERROR: Name: ${errorName}, Message: ${errorMessage}`, error.stack);
    return { success: false, error: `Server error: ${errorMessage}` };
  }
}

export async function logoutAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = cookies();
    console.log("[LogoutAction] Deleting admin_session cookie.");
    cookieStore.delete("admin_session", { path: '/' });
    // No redirect here, client will handle
    return { success: true };
  } catch (error: any) {
     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during logout.";
     console.error("[LogoutAction] Error:", errorMessage, error.stack);
     return { success: false, error: errorMessage };
  }
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
