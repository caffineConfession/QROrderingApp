
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { AdminRole } from '@/types';

const JWT_SECRET_KEY_ENV = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY_ENV || JWT_SECRET_KEY_ENV.trim() === "") {
  // This will now only throw an error when the module is first loaded if the key is missing.
  // It's better than the server crashing silently or using a fallback.
  throw new Error(
    "CRITICAL: JWT_SECRET_KEY is not set or is empty in environment variables. " +
    "Please generate a strong secret key (e.g., `openssl rand -base64 32`) and set it in your .env file. " +
    "The application cannot securely manage sessions without it."
  );
}

// Encode the key only once when the module is loaded.
const key = new TextEncoder().encode(JWT_SECRET_KEY_ENV);
// console.log(`[SessionLib] JWT Secret Key's first few chars: ${JWT_SECRET_KEY_ENV.substring(0,5)}... Key object initialized.`);


interface AdminSessionPayload extends JWTPayload {
  userId: string;
  email?: string;
  role: AdminRole;
  // expiresAt is part of standard JWT 'exp' claim, no need to add explicitly here
  // if using setExpirationTime
}

export async function encryptSession(payload: AdminSessionPayload) {
  // console.log(`[SessionLib] Encrypting session for userId: ${payload.userId}, role: ${payload.role}`);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Standard 'exp' claim
    .sign(key); // Use the module-level 'key'
}

export async function decryptSession(sessionToken: string | undefined): Promise<AdminSessionPayload | null> {
  const tokenExists = !!sessionToken;
  const tokenSnippet = tokenExists ? `${sessionToken.substring(0, 10)}...${sessionToken.substring(sessionToken.length - 10)}` : "Token NOT present";
  
  // console.log(`[SessionLib - decryptSession] Called. Token present: ${tokenExists}. Snippet: ${tokenSnippet}`);

  if (!sessionToken) {
    // console.log("[SessionLib - decryptSession] No token provided, returning null.");
    return null;
  }
  try {
    // The 'key' used here is the module-level encoded key
    const { payload } = await jwtVerify(sessionToken, key, {
      algorithms: ['HS256'],
    });
    // console.log(`[SessionLib - decryptSession] Token decrypted. UserID: ${payload.userId}, Role: ${payload.role}, Expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'}`);
    return payload as AdminSessionPayload;
  } catch (error: any) {
    console.error(`[SessionLib - decryptSession] Failed to verify/decrypt session for token snippet: ${tokenSnippet}.`);
    console.error(`[SessionLib - decryptSession] Error Name: ${error.name}, Code: ${error.code}, Message: ${error.message}`);
    
    // Specific JWT error codes from 'jose' library
    if (error.code === 'ERR_JWT_EXPIRED') {
      console.error("[SessionLib - decryptSession] Specific reason: JWT EXPIRED.");
    } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.error("[SessionLib - decryptSession] Specific reason: JWS SIGNATURE VERIFICATION FAILED (key mismatch or token tampered). Ensure JWT_SECRET_KEY is identical across encryption and decryption.");
    } else if (error.code === 'ERR_JWS_INVALID' || error.code === 'ERR_JWT_INVALID' || error.code === 'ERR_JOSE_NOT_SUPPORTED') {
      console.error(`[SessionLib - decryptSession] Specific reason: JWT is invalid, malformed, or uses an unsupported algorithm. Code: ${error.code}`);
    } else {
      console.error("[SessionLib - decryptSession] Specific reason: Unknown JWT error or other issue during verification.");
    }
    // console.error("[SessionLib - decryptSession] Full error object for debugging:", error); // Full error for detailed diagnosis
    return null;
  }
}
