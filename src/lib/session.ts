
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { AdminRole } from '@/types';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is not set in environment variables. Please generate a strong secret key using 'openssl rand -base64 32'.");
}

const key = new TextEncoder().encode(JWT_SECRET_KEY);

interface AdminSessionPayload extends JWTPayload {
  userId: string;
  email?: string; // Optional, maybe only for business manager
  role: AdminRole;
  expiresAt?: number; // Or manage expiration via JWT `exp` claim
}

export async function encryptSession(payload: AdminSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Standard JWT expiration claim
    .sign(key);
}

export async function decryptSession(sessionToken: string | undefined): Promise<AdminSessionPayload | null> {
  if (!sessionToken) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(sessionToken, key, {
      algorithms: ['HS256'],
    });
    return payload as AdminSessionPayload;
  } catch (error) {
    console.error("Failed to verify session:", error);
    return null;
  }
}
