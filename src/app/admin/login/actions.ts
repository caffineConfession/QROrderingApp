
"use server";

import * as z from "zod";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import type { AdminRole as AppAdminRole } from "@/types";
import { ADMIN_ROLES } from "@/types";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
// Removed redirect from 'next/navigation' as it's handled client-side now in page.tsx

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
    // In a real app, you might throw an error here, but for debugging,
    // we let it proceed to see if the server can at least start.
    // Functionality will fail later if this key is actually used by encrypt.
  }
  jwtSecretKeyInstance = keyFromEnv || "fallback-secret-for-dev-only-if-not-set"; // Fallback only for extreme dev cases
  if (jwtSecretKeyInstance === "fallback-secret-for-dev-only-if-not-set") {
    console.warn("Warning: Using fallback JWT_SECRET_KEY. This is insecure and for development startup aid only.");
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

export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; error?: string }> {
  console.log("[LoginAction] Attempting login for:", credentials.email);
  try {
    // Ensure JWT_SECRET_KEY is available before proceeding with sensitive operations
    // getJwtSecretKey(); // Called by encrypt
    console.log("[LoginAction] JWT Secret Key check will be done by encrypt.");

    const parsedCredentials = loginSchema.safeParse(credentials);
    if (!parsedCredentials.success) {
      console.error("[LoginAction] Validation failed:", parsedCredentials.error.issues);
      return { success: false, error: "Invalid input format for email or password." };
    }
    const { email, password } = parsedCredentials.data;
    const lowercasedEmail = email.toLowerCase();
    console.log(`[LoginAction] Credentials parsed. Querying DB for: ${lowercasedEmail}`);

    if (!process.env.DATABASE_URL) {
        console.error("[LoginAction] DATABASE_URL is not set.");
        return { success: false, error: "Database connection is not configured." };
    }

    const adminUserRecord = await prisma.adminUser.findUnique({
      where: { email: lowercasedEmail },
    });
    console.log("[LoginAction] DB query complete. User found:", !!adminUserRecord);

    if (!adminUserRecord) {
      return { success: false, error: `Admin user with email "${lowercasedEmail}" not found. Please double-check your email.` };
    }

    console.log(`[LoginAction] Comparing provided password with stored hash for user: "${lowercasedEmail}".`);
    const passwordMatch = bcryptjs.compareSync(password, adminUserRecord.passwordHash);
    console.log("[LoginAction] Password comparison complete. Match:", passwordMatch);

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
    console.log("[LoginAction] Admin session cookie set.");
    
    // Do not redirect here. Client will handle it.
    return { success: true };

  } catch (error: any) {
    // Important: Check if it's a redirect error from next/navigation
    // This should not happen here anymore as we removed redirect()
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      console.error("[LoginAction] Unexpected NEXT_REDIRECT error. This should not be thrown here.");
      // Re-throw to let Next.js handle it, though it's unexpected.
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

export async function resetPasswordAction(credentials: any): Promise<{ success: boolean; error?: string; message?: string }> {
  console.log("[ResetPasswordAction] Started for email:", credentials.email);
  try {
    // getJwtSecretKey(); 

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

export async function logoutAction(): Promise<{ success: boolean }> {
  console.log("[LogoutAction] Deleting admin_session cookie.");
  cookies().delete("admin_session");
  // Client-side will handle redirect
  return { success: true };
}
