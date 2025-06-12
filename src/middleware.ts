
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptSession } from '@/lib/session';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
const ADMIN_BASE_PATH = '/admin';

const PUBLIC_ADMIN_PATHS = [ADMIN_LOGIN_PATH];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', pathname); // Make pathname available to Server Components via headers

  console.log(`[Middleware] Request for path: ${pathname}`);

  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const sessionCookieValue = request.cookies.get('admin_session')?.value;
  console.log(`[Middleware] Path: ${pathname}. admin_session cookie value: '${sessionCookieValue || 'not found'}'`);

  let session = null;
  if (sessionCookieValue) {
    try {
      session = await decryptSession(sessionCookieValue);
      console.log(`[Middleware] Path: ${pathname}. Decrypted session:`, session ? JSON.stringify(session) : 'null');
    } catch (e: any) {
      console.error(`[Middleware] Path: ${pathname}. Error decrypting session:`, e.message);
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set('error', 'Invalid session. Please login again.');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_session', { path: '/' }); // Ensure cookie is cleared
      return response;
    }
  } else {
    console.log(`[Middleware] Path: ${pathname}. No session cookie found.`);
  }

  // Protected admin page
  if (!PUBLIC_ADMIN_PATHS.includes(pathname)) {
    if (!session?.userId || !session?.role) {
      console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session invalid or role/userId missing. Redirecting to login.`);
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set('error', 'Session expired or invalid. Please login again.');
      return NextResponse.redirect(loginUrl);
    }
    console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session valid. Allowing access.`);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // Public admin page (e.g., /admin/login)
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    if (pathname === ADMIN_LOGIN_PATH && session?.userId && session?.role) {
      console.log(`[Middleware] Path is ADMIN_LOGIN_PATH. Session is VALID. Redirecting to dashboard.`);
      const dashboardUrl = new URL(ADMIN_DASHBOARD_PATH, request.url);
      const response = NextResponse.redirect(dashboardUrl);
      // Add cache control to redirect response as well
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }
    console.log(`[Middleware] Path "${pathname}" is PUBLIC admin path. Allowing access.`);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  console.warn(`[Middleware] Path "${pathname}" (admin path) did not match conditions. Allowing by default (review logic).`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (custom static assets folder if you have one)
     * - images (custom static images folder if you have one)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images).*)',
  ],
}
