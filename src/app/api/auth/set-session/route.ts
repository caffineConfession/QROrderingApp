
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Session token is required.' }, { status: 400 });
    }

    const cookieStore = cookies();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

    cookieStore.set({
      name: "admin_session",
      value: sessionToken,
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use environment variable
      path: '/',
      sameSite: 'lax',
    });

    console.log("[API/set-session] Admin session cookie set attempt via API. Secure:", process.env.NODE_ENV === 'production');
    return NextResponse.json({ success: true, message: "Session cookie set." });

  } catch (error) {
    console.error('[API/set-session] Error setting session cookie:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, error: `Failed to set session cookie: ${errorMessage}` }, { status: 500 });
  }
}
