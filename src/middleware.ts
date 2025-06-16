
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptSession } from '@/lib/session';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
const ADMIN_BASE_PATH = '/admin';

// Only /admin/login is public within the /admin/* space
// All other /admin/* paths require authentication.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  // Pass the actual pathname to Server Components (like AdminLayout)
  // It's more reliable than trying to infer from cookies or other means in Server Components.
  requestHeaders.set('x-next-pathname', pathname);

  console.log(`[Middleware] Executing for path: ${pathname}`);

  // If the path is not an admin path, pass through without admin session logic.
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    console.log(`[Middleware] Path "${pathname}" is not an admin path. Allowing.`);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const sessionCookieValue = request.cookies.get('admin_session')?.value;
  const displayableToken = sessionCookieValue ? `${sessionCookieValue.substring(0, 15)}...` : 'not found';
  console.log(`[Middleware] Path: "${pathname}". Admin session cookie from request.cookies: '${displayableToken}'`);

  let session = null;
  if (sessionCookieValue) {
    try {
      // decryptSession in src/lib/session.ts has detailed logging for success/failure
      session = await decryptSession(sessionCookieValue);
      if (session) {
        console.log(`[Middleware] Path: "${pathname}". Session decrypted successfully. UserID: ${session.userId}, Role: ${session.role}`);
      } else {
        // This case implies decryptSession returned null (e.g., token expired, signature failed, etc.)
        console.log(`[Middleware] Path: "${pathname}". decryptSession returned null, indicating invalid token.`);
      }
    } catch (e: any) {
      // This catch is for truly unexpected errors *during* the decryptSession call itself,
      // though decryptSession is designed to handle its own JWT-related errors and return null.
      console.error(`[Middleware] Path: "${pathname}". CRITICAL UNEXPECTED error during decryptSession call:`, e.message);
      // It's safer to assume the session is invalid and redirect.
      session = null; // Ensure session is treated as invalid.
    }
  } else {
    console.log(`[Middleware] Path: "${pathname}". No admin_session cookie found.`);
  }

  // Handling the /admin/login page
  if (pathname === ADMIN_LOGIN_PATH) {
    if (session?.userId && session?.role) {
      console.log(`[Middleware] Path is ADMIN_LOGIN_PATH but a valid session exists. Redirecting to dashboard: ${ADMIN_DASHBOARD_PATH}`);
      const dashboardResponse = NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
      dashboardResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      dashboardResponse.headers.set('Pragma', 'no-cache');
      dashboardResponse.headers.set('Expires', '0');
      return dashboardResponse;
    }
    // If on /admin/login and no valid session, allow access.
    console.log(`[Middleware] Path is ADMIN_LOGIN_PATH. No valid session or already on login. Allowing access.`);
    const loginResponse = NextResponse.next({ request: { headers: requestHeaders } });
    loginResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    loginResponse.headers.set('Pragma', 'no-cache');
    loginResponse.headers.set('Expires', '0');
    return loginResponse;
  }

  // For all other /admin/* paths (which are protected)
  if (!session?.userId || !session?.role) {
    console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session is invalid or user/role missing. Redirecting to login.`);
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    let errorMessage = 'Session expired or invalid. Please login again.';
    if (!sessionCookieValue) {
        errorMessage = 'You are not logged in. Please login.';
    }
    loginUrl.searchParams.set('error', errorMessage);
    
    const redirectResponse = NextResponse.redirect(loginUrl);
    // If there was a cookie but decryption failed (session is null), clear the bad cookie.
    if (sessionCookieValue && !session) {
        console.log(`[Middleware] Clearing potentially invalid admin_session cookie for path "${pathname}" due to decryption failure.`);
        redirectResponse.cookies.delete('admin_session', { path: '/' });
    }
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

  // If session is valid and it's a protected admin path (e.g., /admin/dashboard, /admin/orders)
  console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session valid. Allowing access.`);
  const protectedResponse = NextResponse.next({ request: { headers: requestHeaders } });
  protectedResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  protectedResponse.headers.set('Pragma', 'no-cache');
  protectedResponse.headers.set('Expires', '0');
  return protectedResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths starting with /admin.
     * This includes /admin, /admin/login, /admin/dashboard, /admin/orders, etc.
     */
    '/admin/:path*',
  ],
};
