
'use server';

import { z } from "zod";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { encryptSession } from '@/lib/session';
import { ResetPasswordSchema, type ResetPasswordFormData } from "./schemas";
import { redirect } from 'next/navigation';
import { cookies } from "next/headers";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; error?: string; token?: string; }> {
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

    const sessionPayload = {
      userId: adminUserRecord.id,
      email: adminUserRecord.email,
      role: adminUserRecord.role,
    };
    const sessionToken = await encryptSession(sessionPayload);
    console.log(`[LoginAction] Session token generated. Returning token to client.`);
    
    // Instead of redirecting, return the token
    return { success: true, token: sessionToken };

  } catch (error: any) {
    console.error("[LoginAction] A critical error occurred during login process:", error);
    // This will catch database errors or other unexpected issues.
    return { success: false, error: 'A server error occurred. Please try again later.' };
  }
}

export async function logoutAction() {
  console.log("[LogoutAction] Initiating logout. Redirecting to clear session via middleware.");
  // This redirect is fine as it's typically called from a simple link or button click, not a complex form state.
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
