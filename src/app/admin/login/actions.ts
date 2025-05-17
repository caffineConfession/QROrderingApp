
"use server";

import * as z from "zod";
import { cookies } from "next/headers";
import { SignJWT, importJWK } from "jose";
import type { AdminRole } from "@/types";
import { ADMIN_ROLES } from "@/types";

// WARNING: These are hardcoded credentials for demonstration purposes only.
// In a real application, use a secure authentication system and database.
const ADMIN_CREDENTIALS: Record<string, { passwordHash: string; role: AdminRole }> = {
  "manualorder@caffico.com": { passwordHash: "manualPass123", role: ADMIN_ROLES.MANUAL_ORDER_TAKER }, // Replace with actual hashed passwords in a real app
  "processor@caffico.com": { passwordHash: "processorPass123", role: ADMIN_ROLES.ORDER_PROCESSOR },
  "manager@caffico.com": { passwordHash: "managerPass123", role: ADMIN_ROLES.BUSINESS_MANAGER },
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Ensure JWT_SECRET_KEY is set in your environment variables
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is not set in environment variables. Please generate a strong secret key.");
}

const key = new TextEncoder().encode(JWT_SECRET_KEY);

async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // Token expires in 1 day
    .sign(key);
}


export async function loginAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; role?: AdminRole; error?: string }> {
  const parsedCredentials = loginSchema.safeParse(credentials);

  if (!parsedCredentials.success) {
    return { success: false, error: "Invalid input." };
  }

  const { email, password } = parsedCredentials.data;
  const adminUser = ADMIN_CREDENTIALS[email.toLowerCase()];

  // In a real app, use a secure password hashing and comparison library (e.g., bcrypt)
  if (adminUser && password === adminUser.passwordHash) { // Simple comparison for hardcoded, replace with bcrypt.compare
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const sessionPayload = {
      email: adminUser.role === ADMIN_ROLES.BUSINESS_MANAGER ? email : undefined, // Only include email for business manager for now
      role: adminUser.role,
      userId: email, // Using email as a temporary userId
    };
    
    const session = await encrypt(sessionPayload);

    cookies().set("admin_session", session, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
    return { success: true, role: adminUser.role };
  }

  return { success: false, error: "Invalid email or password." };
}

export async function logoutAction() {
  cookies().delete("admin_session");
}
