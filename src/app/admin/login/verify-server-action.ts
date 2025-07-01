
'use server';

import { cookies } from 'next/headers';

export async function setSessionCookie(token: string) {
  try {
    console.log('[VerifyServerAction] Setting admin_session cookie.');
    cookies().set('admin_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Will be false in dev, true in prod
      sameSite: 'lax', // Lax is a good default
      maxAge: 60 * 60 * 24, // 1 day
    });
    console.log('[VerifyServerAction] Cookie set successfully.');
    return { success: true };
  } catch (error) {
    console.error('[VerifyServerAction] Failed to set cookie:', error);
    return { success: false, error: 'Failed to set session cookie.' };
  }
}
