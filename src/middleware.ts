
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
const ADMIN_BASE_PATH = '/admin';
const ADMIN_LOGOUT_PATH = '/admin/logout';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`[Middleware] Request for path: ${pathname}`);

  // Handle clearing the session cookie on logout
  if (pathname === ADMIN_LOGOUT_PATH) {
    console.log(`[Middleware] At ${ADMIN_LOGOUT_PATH}. Clearing cookie and redirecting to login.`);
    const response = NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    response.cookies.delete('admin_session', { path: '/' });
    return response;
  }
  
  // If not an admin path, just continue
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return NextResponse.next();
  }

  // For all other /admin paths, check for a valid session
  const sessionCookieValue = request.cookies.get('admin_session')?.value;
  console.log("[Middleware] Cookie read:", sessionCookieValue || "not found");
  let session = null;
  if (sessionCookieValue) {
    session = await decryptSession(sessionCookieValue);
  }

  // If user is on the login page
  if (pathname === ADMIN_LOGIN_PATH) {
    if (session?.userId) {
      // If they have a valid session, redirect them to the dashboard
      console.log(`[Middleware] Valid session exists. Redirecting from login page to dashboard.`);
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
    }
    // If they don't have a session, let them see the login page
    return NextResponse.next();
  }

  // For any other protected admin page
  if (!session?.userId) {
    console.log(`[Middleware] No valid session for protected route: ${pathname}. Redirecting to login.`);
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('error', `Session expired or invalid. Please login to access ${pathname}.`);
    return NextResponse.redirect(loginUrl);
  }
  
  console.log(`[Middleware] Session valid for ${pathname}. Allowing access for user: ${session.email}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all paths under /admin/
    '/admin/:path*',
  ],
};
