import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
const ADMIN_BASE_PATH = '/admin';
const ADMIN_VERIFY_PATH = '/admin/login/verify';
const ADMIN_LOGOUT_PATH = '/admin/logout';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', pathname);

  console.log(`[Middleware] Request for path: ${pathname}`);

  // Handle setting the session cookie via redirect from login
  if (pathname === ADMIN_VERIFY_PATH) {
    const token = searchParams.get('token');
    if (!token) {
      console.log(`[Middleware] At ${ADMIN_VERIFY_PATH} but no token found. Redirecting to login.`);
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }

    console.log(`[Middleware] Token found at ${ADMIN_VERIFY_PATH}. Setting cookie and redirecting to dashboard.`);
    const response = NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
    
    // Explicitly set cookie attributes for robust behavior
    response.cookies.set({
      name: 'admin_session',
      value: token,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Lax is a good default for security and usability
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    });
    console.log(`[Middleware] Cookie set for response to redirect to dashboard. Secure: ${process.env.NODE_ENV === 'production'}`);
    return response;
  }

  // Handle clearing the session cookie on logout
  if (pathname === ADMIN_LOGOUT_PATH) {
    console.log(`[Middleware] At ${ADMIN_LOGOUT_PATH}. Clearing cookie and redirecting to login.`);
    const response = NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    response.cookies.delete('admin_session', { path: '/' });
    return response;
  }
  
  // If not an admin path, just continue
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // For all other /admin paths, check for a valid session
  const sessionCookieValue = request.cookies.get('admin_session')?.value;
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
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // For any other protected admin page
  if (!session?.userId) {
    console.log(`[Middleware] No valid session for protected route: ${pathname}. Redirecting to login.`);
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('error', `Session expired or invalid. Please login to access ${pathname}.`);
    return NextResponse.redirect(loginUrl);
  }
  
  console.log(`[Middleware] Session valid for ${pathname}. Allowing access for user: ${session.email}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Apply middleware to all paths under /admin/
    '/admin/:path*',
  ],
};
