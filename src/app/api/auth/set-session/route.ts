
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("[API/set-session] Received request to set session cookie.");
  try {
    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken || typeof sessionToken !== 'string') {
      console.error("[API/set-session] Session token is missing or invalid in request body.");
      return NextResponse.json({ success: false, error: 'Session token is required.' }, { status: 400 });
    }

    const cookieStore = cookies();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      name: "admin_session",
      value: sessionToken,
      expires,
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: 'lax' as 'lax' | 'strict' | 'none' | undefined, // Explicitly type
    };

    console.log("[API/set-session] Attempting to set cookie with options:", cookieOptions);
    cookieStore.set(cookieOptions);

    console.log(`[API/set-session] Admin session cookie set attempt finished. Secure: ${isProduction}`);
    return NextResponse.json({ success: true, message: "Session cookie set." });

  } catch (error) {
    console.error('[API/set-session] Error setting session cookie:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, error: `Failed to set session cookie: ${errorMessage}` }, { status: 500 });
  }
}
