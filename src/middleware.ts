
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
const ADMIN_BASE_PATH = '/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', pathname); 

  console.log(`[Middleware] Request for path: ${pathname}`);

  // Log all cookies received by the middleware for this request
  const allCookies = request.cookies.getAll();
  console.log(`[Middleware] Path: "${pathname}". All cookies received:`, allCookies.map(c => ({ name: c.name, value: c.value.substring(0,10) + '...' })));


  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    console.log(`[Middleware] Path "${pathname}" is not an admin path. Allowing.`);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const sessionCookieValue = request.cookies.get('admin_session')?.value;
  const sessionCookieFound = !!sessionCookieValue;
  console.log(`[Middleware] Path: "${pathname}". Attempting to read 'admin_session' cookie. Value found: ${sessionCookieFound ? `'${sessionCookieValue?.substring(0, 20)}...'` : 'not found'}`);

  let session = null;
  if (sessionCookieValue) {
    console.log(`[Middleware] Path: "${pathname}". Cookie found, calling decryptSession for token snippet: '${sessionCookieValue.substring(0,20)}...'`);
    session = await decryptSession(sessionCookieValue); 
    if (session) {
      const expiresDate = session.exp ? new Date(session.exp * 1000) : 'N/A';
      console.log(`[Middleware] Path: "${pathname}". Session decrypted successfully by middleware. UserID: ${session.userId}, Role: ${session.role}, Expires: ${expiresDate}`);
    } else {
      console.log(`[Middleware] Path: "${pathname}". decryptSession returned null for the cookie (indicates invalid/expired token or decryption error).`);
    }
  } else {
    console.log(`[Middleware] Path: "${pathname}". No 'admin_session' cookie value was found by middleware.`);
  }

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

  if (!session?.userId || !session?.role) {
    console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session is invalid (userId or role missing). Redirecting to login.`);
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    
    let errorMessage = `Login Required: Session invalid or expired for path '${pathname}'. Please login again.`;
    if (!sessionCookieValue) {
        errorMessage = `Login Required: No session found for path '${pathname}'. Please login.`;
    } else if (!session) {
        errorMessage = `Login Required: Session token for path '${pathname}' was invalid (e.g., expired, malformed, or signature mismatch). Please login again.`;
    }
    
    loginUrl.searchParams.set('error', encodeURIComponent(errorMessage));
    
    const redirectResponse = NextResponse.redirect(loginUrl);
    if (sessionCookieValue && !session) {
        console.log(`[Middleware] Path "${pathname}". Clearing potentially invalid 'admin_session' cookie due to decryption failure or invalid content.`);
        redirectResponse.cookies.delete('admin_session', { path: '/' });
    }
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

  console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session valid. Allowing access for user: ${session.email}, role: ${session.role}.`);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
