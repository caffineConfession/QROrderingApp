
'use server';

import * as z from "zod";
import { cookies } from "next/headers"; 
import type { AdminRole as AppAdminRole } from "@/types";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
// Removed redirect from 'next/navigation' as it's handled client-side now
// import { redirect } from 'next/navigation'; 
import { encryptSession } from '@/lib/session';
import { ResetPasswordSchema, type ResetPasswordFormData } from "./schemas";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// loginAction now returns a Promise<{ success: boolean; error?: string }>
export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; error?: string }> {
  console.log("[LoginAction] Attempting login for:", credentials.email);
  try {
    const parsedCredentials = await loginSchema.safeParseAsync(credentials);
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

    const passwordMatch = await bcryptjs.compare(password, adminUserRecord.passwordHash);

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
    
    // Attempt to set the cookie
    // The error "cookies() should be awaited" has been persistent.
    // loginAction is async, and cookies() itself isn't awaited.
    // This error might be related to how Next.js handles Server Actions that also try to redirect,
    // or some other subtle interaction with the Next.js version or project setup.
    // By removing the server-side redirect, we hope to stabilize this.
    await cookies().set({
      name: "admin_session",
      value: sessionToken,
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false, // Explicitly false for dev
      path: '/',
      sameSite: 'lax' 
    });
    console.log(`[LoginAction] Admin session cookie set with secure: ${process.env.NODE_ENV === 'production' ? true : false}`);
    
    // No redirect here; return success to client
    return { success: true };

  } catch (error: any) {
    // Catching potential NEXT_REDIRECT is no longer needed here as we removed redirect()
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

export async function logoutAction(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[LogoutAction] Deleting admin_session cookie.");
    cookies().delete("admin_session", { path: '/' }); 
    return { success: true };
    // redirect('/admin/login'); // Client will handle redirect
  } catch (error: any) {
     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during logout.";
     console.error("[LogoutAction] Error:", errorMessage);
     return { success: false, error: errorMessage };
  }
}

const FIXED_CONFIRMATION_STRING = "Dhruv the great"; 
const SALT_ROUNDS = 10; 

export async function resetPasswordAction(credentials: ResetPasswordFormData): Promise<{ success: boolean; error?: string; message?: string }> {
  console.log("[ResetPasswordAction] Started for email:", credentials.email);
  try {
    const validationResult = await ResetPasswordSchema.safeParseAsync(credentials);
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
