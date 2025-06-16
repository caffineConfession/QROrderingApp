
'use server';

import * as z from "zod";
import { cookies } from "next/headers"; 
import { SignJWT } from "jose";
import type { AdminRole as AppAdminRole } from "@/types";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { redirect } from 'next/navigation'; 
import { encryptSession } from '@/lib/session';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

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

    const passwordMatch = await bcryptjs.compare(password, adminUserRecord.passwordHash); // IMPORTANT: Added await

    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password." };
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const sessionRole: AppAdminRole = adminUserRecord.role as AppAdminRole; 

    const sessionPayload = {
      userId: adminUserRecord.id,
      email: adminUserRecord.email,
      role: sessionRole,
    };

    const sessionToken = await encryptSession(sessionPayload);
    console.log(`[LoginAction] Session token created for user: "${lowercasedEmail}"`);
    
    // Ensure cookies() is from next/headers
    const cookieStore = cookies();
    cookieStore.set({
      name: "admin_session",
      value: sessionToken,
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      path: '/',
      sameSite: 'lax' 
    });
    console.log(`[LoginAction] Admin session cookie set with secure: ${process.env.NODE_ENV === 'production'}`);
    
    redirect('/admin/dashboard'); 

  } catch (error: any) {
    const isNextRedirectError = typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT');

    if (isNextRedirectError) {
      console.log("[LoginAction] Caught NEXT_REDIRECT, re-throwing.");
      throw error; 
    }

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("[LoginAction] CRITICAL ERROR during login processing:", {
        message: errorMessage,
        name: error.name,
        stack: error.stack,
        errorObjectString: String(error) 
    });
    return { success: false, error: `Server error during login: ${errorMessage}` };
  }
}

export async function logoutAction(): Promise<void> {
  console.log("[LogoutAction] Deleting admin_session cookie.");
  const cookieStore = cookies();
  cookieStore.delete("admin_session", { path: '/' }); 
  redirect('/admin/login'); 
}

// ResetPasswordSchema and resetPasswordAction remain unchanged from previous versions
const FIXED_CONFIRMATION_STRING = "Dhruv the great"; 
const SALT_ROUNDS = 10; 

export const ResetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  confirmationString: z.string().min(1, { message: "Confirmation string is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long." }),
});
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;


export async function resetPasswordAction(credentials: ResetPasswordFormData): Promise<{ success: boolean; error?: string; message?: string }> {
  console.log("[ResetPasswordAction] Started for email:", credentials.email);
  try {
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
