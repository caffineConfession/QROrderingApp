
// src/middleware.ts
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

  const allCookiesArray = request.cookies.getAll();
  if (allCookiesArray.length > 0) {
    // Simplified logging for all cookies
    const cookieNames = allCookiesArray.map(c => c.name);
    console.log(`[Middleware] Path: "${pathname}". All cookies received (names): ${JSON.stringify(cookieNames)}`);
    const adminSessionCookie = allCookiesArray.find(c => c.name === 'admin_session');
    if (adminSessionCookie) {
        console.log(`[Middleware] Path: "${pathname}". 'admin_session' cookie value snippet: ${adminSessionCookie.value.substring(0,15)}...`);
    } else {
        console.log(`[Middleware] Path: "${pathname}". 'admin_session' cookie NOT FOUND in received cookies.`);
    }
  } else {
    console.log(`[Middleware] Path: "${pathname}". No cookies received by middleware.`);
  }

  // Pass through non-admin routes
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const sessionCookieValue = request.cookies.get('admin_session')?.value;
  let session = null;

  const logPrefix = `[Middleware] Path: "${pathname}".`;

  if (sessionCookieValue) {
    console.log(`${logPrefix} Attempting to read 'admin_session' cookie. Value found: ${sessionCookieValue ? `'${sessionCookieValue.substring(0, 20)}...'` : 'undefined/empty'}`);
    session = await decryptSession(sessionToken); // Changed from sessionCookieValue to sessionToken
    if (session) {
      const expiresDate = session.exp ? new Date(session.exp * 1000) : 'N/A';
      console.log(`${logPrefix} Session decrypted successfully. UserID: ${session.userId}, Role: ${session.role}, Expires: ${expiresDate}`);
    } else {
      console.log(`${logPrefix} decryptSession returned null for the cookie: ${sessionCookieValue ? `'${sessionCookieValue.substring(0,20)}...'` : 'undefined/empty'}`);
    }
  } else {
    console.log(`${logPrefix} No 'admin_session' cookie value was found in request.cookies.get().`);
  }


  // Handle the login page itself
  if (pathname === ADMIN_LOGIN_PATH) {
    let response;
    if (session?.userId && session?.role) {
      console.log(`${logPrefix} Path is ADMIN_LOGIN_PATH but a valid session exists. Redirecting to ${ADMIN_DASHBOARD_PATH}`);
      response = NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
    } else {
      console.log(`${logPrefix} Path is ADMIN_LOGIN_PATH. No valid session or already on login. Allowing access.`);
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
    // Set cache control headers for the login page response
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // For all other /admin/* routes, require a valid session
  if (!session?.userId || !session?.role) {
    console.log(`${logPrefix} Path is PROTECTED. Session is invalid (userId or role missing). Redirecting to login.`);
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    
    let errorMessage = `Login Required: Your session is invalid or expired for path '${pathname}'. Please login again.`;
    if (!sessionCookieValue) { // If no cookie was found at all
        errorMessage = `Login Required: No session found for path '${pathname}'. Please login.`;
    } else if (!session) { // If cookie was found but decryption failed
        errorMessage = `Login Required: Session token for path '${pathname}' was invalid. Please login again.`;
    }
    
    loginUrl.searchParams.set('error', encodeURIComponent(errorMessage));
    
    const redirectResponse = NextResponse.redirect(loginUrl);
    // If a cookie was present but invalid, clear it
    if (sessionCookieValue && !session) { 
        console.log(`${logPrefix} Clearing potentially invalid 'admin_session' cookie.`);
        redirectResponse.cookies.delete('admin_session', { path: '/' });
    }
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

  // If session is valid for a protected route
  console.log(`${logPrefix} Path is PROTECTED. Session valid. Allowing access for user: ${session.email}, role: ${session.role}.`);
  const finalResponse = NextResponse.next({ request: { headers: requestHeaders } });
  finalResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  finalResponse.headers.set('Pragma', 'no-cache');
  finalResponse.headers.set('Expires', '0');
  return finalResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
    