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
    console.log(`[Middleware] Path: "${pathname}". All cookies received (names):`, JSON.stringify(allCookiesArray.map(c => c.name)));
  } else {
    console.log(`[Middleware] Path: "${pathname}". No cookies received.`);
  }


  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const sessionCookieValue = request.cookies.get('admin_session')?.value;
  const sessionCookieFound = !!sessionCookieValue;
  let session = null;

  const logPrefix = `[Middleware] Path: "${pathname}".`;

  if (sessionCookieFound) {
    console.log(`${logPrefix} Attempting to read 'admin_session' cookie. Value found: ${sessionCookieValue ? `'${sessionCookieValue.substring(0, 20)}...'` : 'undefined/empty'}`);
    session = await decryptSession(sessionCookieValue); 
    if (session) {
      const expiresDate = session.exp ? new Date(session.exp * 1000) : 'N/A';
      console.log(`${logPrefix} Session decrypted successfully by middleware. UserID: ${session.userId}, Role: ${session.role}, Expires: ${expiresDate}`);
    } else {
      console.log(`${logPrefix} decryptSession returned null for the cookie: ${sessionCookieValue ? `'${sessionCookieValue.substring(0,20)}...'` : 'undefined/empty'}`);
    }
  } else {
    console.log(`${logPrefix} No 'admin_session' cookie value was found by middleware.`);
  }

  if (pathname === ADMIN_LOGIN_PATH) {
    let response;
    if (session?.userId && session?.role) {
      console.log(`${logPrefix} Path is ADMIN_LOGIN_PATH but a valid session exists. Redirecting to ${ADMIN_DASHBOARD_PATH}`);
      response = NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
    } else {
      console.log(`${logPrefix} Path is ADMIN_LOGIN_PATH. No valid session or already on login. Allowing access.`);
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  if (!session?.userId || !session?.role) {
    console.log(`${logPrefix} Path is PROTECTED. Session is invalid (userId or role missing). Redirecting to login.`);
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    
    let errorMessage = `Login Required: Session invalid or expired for path '${pathname}'. Please login again.`;
    if (!sessionCookieFound) {
        errorMessage = `Login Required: No session found for path '${pathname}'. Please login.`;
    } else if (!session) { 
        errorMessage = `Login Required: Session token for path '${pathname}' was invalid. Please login again.`;
    }
    
    loginUrl.searchParams.set('error', encodeURIComponent(errorMessage));
    
    const redirectResponse = NextResponse.redirect(loginUrl);
    if (sessionCookieValue && !session) { 
        console.log(`${logPrefix} Clearing potentially invalid 'admin_session' cookie.`);
        redirectResponse.cookies.delete('admin_session', { path: '/' });
    }
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

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