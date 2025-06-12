
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { AdminRole } from '@/types';

const JWT_SECRET_KEY_ENV = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY_ENV || JWT_SECRET_KEY_ENV.trim() === "") {
  throw new Error("JWT_SECRET_KEY is not set or is empty in environment variables. Please generate a strong secret key using 'openssl rand -base64 32' and set it in your .env file.");
}

const key = new TextEncoder().encode(JWT_SECRET_KEY_ENV);

interface AdminSessionPayload extends JWTPayload {
  userId: string;
  email?: string;
  role: AdminRole;
  expiresAt?: number;
}

export async function encryptSession(payload: AdminSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

export async function decryptSession(sessionToken: string | undefined): Promise<AdminSessionPayload | null> {
  const tokenExists = !!sessionToken;
  const tokenSnippet = tokenExists ? `${sessionToken.substring(0, 10)}...${sessionToken.substring(sessionToken.length - 10)}` : "Token NOT present";
  
  console.log(`[decryptSession] Called. Token present: ${tokenExists}. Snippet: ${tokenSnippet}`);

  if (!sessionToken) {
    console.log("[decryptSession] No token provided, returning null.");
    return null;
  }
  try {
    const { payload } = await jwtVerify(sessionToken, key, {
      algorithms: ['HS256'],
    });
    console.log(`[decryptSession] Token decrypted successfully for snippet: ${tokenSnippet}. Payload:`, JSON.stringify(payload));
    return payload as AdminSessionPayload;
  } catch (error: any) {
    console.error(`[decryptSession] Failed to verify/decrypt session for token snippet: ${tokenSnippet}. Error Code: ${error.code}, Message: ${error.message}`);
    // console.error("[decryptSession] Full error object:", error); // Uncomment for very detailed error
    if (error.code === 'ERR_JWT_EXPIRED') {
      console.error("[decryptSession] Specific reason: JWT EXPIRED");
    } else if (error.code === 'ERR_JWS_INVALID' || error.code === 'ERR_JWT_INVALID') {
      console.error("[decryptSession] Specific reason: JWT INVALID (malformed or structure error)");
    } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.error("[decryptSession] Specific reason: JWS SIGNATURE VERIFICATION FAILED (key mismatch or token tampered)");
    } else {
      console.error("[decryptSession] Specific reason: Unknown JWT error or other issue during verification.");
    }
    return null;
  }
}
