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

export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: false; error: string; } | void> {
  console.log("[LoginAction] Attempting login for:", credentials.email);
  
  const parsedCredentials = loginSchema.safeParse(credentials);
  if (!parsedCredentials.success) {
    const errorMessages = parsedCredentials.error.issues.map(issue => issue.message).join(", ");
    console.error("[LoginAction] Validation failed:", errorMessages);
    return { success: false, error: `Invalid input: ${errorMessages}` };
  }
  
  const { email, password } = parsedCredentials.data;
  const lowercasedEmail = email.toLowerCase();

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
  console.log(`[LoginAction] Session token generated. Redirecting to verification URL.`);
  
  // This will throw NEXT_REDIRECT, which is expected and should not be caught here.
  redirect(`/admin/login/verify?token=${sessionToken}`);
}

export async function logoutAction() {
  console.log("[LogoutAction] Initiating logout. Redirecting to clear session via middleware.");
  // This will throw NEXT_REDIRECT, which is expected and should not be caught here.
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
