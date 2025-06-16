
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptSession } from '@/lib/session';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
const ADMIN_BASE_PATH = '/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', pathname); // Pass actual pathname to Server Components

  console.log(`[Middleware] Request for path: ${pathname}`);

  // If the path is not an admin path, pass through.
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    console.log(`[Middleware] Path "${pathname}" is not an admin path. Allowing.`);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const sessionCookieValue = request.cookies.get('admin_session')?.value;
  console.log(`[Middleware] Path: "${pathname}". Attempting to read 'admin_session' cookie. Value found: ${sessionCookieValue ? `'${sessionCookieValue.substring(0, 20)}...'` : 'not found'}`);

  let session = null;
  if (sessionCookieValue) {
    console.log(`[Middleware] Path: "${pathname}". Cookie found, calling decryptSession for token snippet: '${sessionCookieValue.substring(0,20)}...'`);
    session = await decryptSession(sessionCookieValue); // decryptSession has its own detailed logging
    if (session) {
      console.log(`[Middleware] Path: "${pathname}". Session decrypted successfully by middleware. UserID: ${session.userId}, Role: ${session.role}, Expires: ${session.exp ? new Date(session.exp * 1000) : 'N/A'}`);
    } else {
      console.log(`[Middleware] Path: "${pathname}". decryptSession returned null for the cookie (indicates invalid/expired token or decryption error).`);
    }
  } else {
    console.log(`[Middleware] Path: "${pathname}". No 'admin_session' cookie value was found by middleware.`);
  }

  // Handling the /admin/login page
  if (pathname === ADMIN_LOGIN_PATH) {
    let response;
    if (session?.userId && session?.role) {
      console.log(`[Middleware] Path is ADMIN_LOGIN_PATH but a valid session exists. Redirecting to ${ADMIN_DASHBOARD_PATH}`);
      response = NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
    } else {
      console.log(`[Middleware] Path is ADMIN_LOGIN_PATH. No valid session or already on login. Allowing access.`);
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // For all other /admin/* paths (which are protected)
  if (!session?.userId || !session?.role) {
    console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session is invalid (userId or role missing). Redirecting to login.`);
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    
    let errorMessage = `Login Required: Session expired or invalid for path '${pathname}'. Please login again.`;
    if (!sessionCookieValue) {
        errorMessage = `Login Required: No session found for path '${pathname}'. Please login.`;
    } else if (!session) {
        // This case means cookie was present, but decryptSession failed
        errorMessage = `Login Required: Session token for path '${pathname}' was invalid (e.g., expired, malformed, or signature mismatch). Please login again.`;
    }
    
    loginUrl.searchParams.set('error', errorMessage);
    
    const redirectResponse = NextResponse.redirect(loginUrl);
    // If there was a cookie but decryption failed (session is null), clear the bad cookie.
    if (sessionCookieValue && !session) {
        console.log(`[Middleware] Path "${pathname}". Clearing potentially invalid 'admin_session' cookie due to decryption failure or invalid content.`);
        redirectResponse.cookies.delete('admin_session', { path: '/' });
    }
    // Add Cache-Control headers to the redirect response
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

  // If session is valid and it's a protected admin path
  console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session valid. Allowing access for user: ${session.email}, role: ${session.role}.`);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths starting with /admin.
     * This includes /admin, /admin/login, /admin/dashboard, /admin/orders, etc.
     * It's important this doesn't match _next/static, _next/image, or api routes unless intended.
     * A more specific matcher might be '/admin/:path*'
     * The current one '/admin/:path*' is generally correct for admin sections.
     */
    '/admin/:path*',
  ],
};
