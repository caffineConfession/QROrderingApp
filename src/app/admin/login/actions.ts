
"use server";

import * as z from "zod";
import { cookies } from "next/headers"; // Ensure correct import
import { SignJWT } from "jose";
import type { AdminRole as AppAdminRole } from "@/types";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { redirect } from 'next/navigation'; 

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
    jwtSecretKeyInstance = "fallback-secret-for-dev-only-if-not-set-and-env-is-broken"; 
    if (jwtSecretKeyInstance === "fallback-secret-for-dev-only-if-not-set-and-env-is-broken") {
      console.warn("WARNING: Using a DANGEROUSLY INSECURE FALLBACK JWT_SECRET_KEY. THIS MUST BE FIXED IMMEDIATELY. ENSURE JWT_SECRET_KEY IS SET IN .env");
    }
  } else {
    jwtSecretKeyInstance = keyFromEnv;
  }
  return jwtSecretKeyInstance;
}

async function encrypt(payload: any) {
  const secret = getJwtSecretKey();
  if (!secret || secret === "fallback-secret-for-dev-only-if-not-set-and-env-is-broken") {
    throw new Error("JWT_SECRET_KEY is not properly configured for session encryption. Application cannot proceed securely.");
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
    
    // The 'cookies().set(...)' error usually means the async context of the Server Action
    // is not correctly recognized by Next.js when this specific dynamic function is called.
    // Ensuring the Server Action itself is 'async' and 'cookies' is imported from 'next/headers'
    // is the primary way to address this. If it persists, it might be a deeper issue in the
    // Next.js version or interaction with other parts of the app.
    // For now, the usage is standard. We'll rely on the Server Component fixes to stabilize cookie reading.
    cookies().set({
      name: "admin_session",
      value: sessionToken,
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'development' ? false : true, // Explicitly false for dev
      path: '/',
      sameSite: 'lax' 
    });
    console.log(`[LoginAction] Admin session cookie set with secure: ${process.env.NODE_ENV === 'development' ? false : true}`);
    
    // This redirect is standard for server actions. Next.js handles it by throwing
    // a special error that the client-side framework part should catch and process.
    // Code after redirect() in a server action will not execute if redirect occurs.
    // This is where the "NEXT_REDIRECT" error originates which is caught by the client.
    redirect('/admin/dashboard'); 

  } catch (error: any) {
    // This will catch errors from prisma, bcrypt, encrypt, or the redirect itself.
    const isNextRedirectError = typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT');

    if (isNextRedirectError) {
      console.log("[LoginAction] Caught NEXT_REDIRECT, re-throwing.");
      throw error; // Re-throw for Next.js to handle the redirect.
    }

    // For any other errors, log them and return an error object to the client.
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
  cookies().delete("admin_session", { path: '/' }); 
  redirect('/admin/login'); 
}

export async function resetPasswordAction(credentials: any): Promise<{ success: boolean; error?: string; message?: string }> {
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

    