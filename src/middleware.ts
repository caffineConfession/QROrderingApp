
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptSession } from '@/lib/session';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
const ADMIN_BASE_PATH = '/admin';

// Add paths that should be accessible without authentication
const PUBLIC_ADMIN_PATHS = [ADMIN_LOGIN_PATH];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Request for path: ${pathname}`);

  // If it's not an admin path, let it pass
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    console.log(`[Middleware] Path "${pathname}" is not an admin path. Allowing.`);
    return NextResponse.next();
  }

  const sessionCookieValue = request.cookies.get('admin_session')?.value;
  // Log cookie only for relevant paths for brevity, but always log its presence/absence
  console.log(`[Middleware] Path: ${pathname}. Checking for 'admin_session' cookie. Found: ${sessionCookieValue ? 'Yes' : 'No'}`);


  const session = await decryptSession(sessionCookieValue);
  if (pathname.startsWith(ADMIN_BASE_PATH)) { // Log decrypted session for all admin paths for debugging
    console.log(`[Middleware] Path: ${pathname}. Decrypted session object from cookie:`, session);
  }

  // User is trying to access a protected admin page
  if (!PUBLIC_ADMIN_PATHS.includes(pathname)) {
    if (!session?.userId || !session?.role) { // More robust check for a valid session
      console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session invalid or role/userId missing. Redirecting to login.`);
      console.log(`[Middleware] >> Details: session.userId=${session?.userId}, session.role=${session?.role}`);
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }
    // If session is valid, allow access to protected page
    console.log(`[Middleware] Path "${pathname}" is PROTECTED. Session valid. Allowing access.`);
    return NextResponse.next();
  }

  // User is trying to access a public admin page (e.g., /admin/login)
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    // If on /admin/login AND a valid session exists, redirect to dashboard
    if (pathname === ADMIN_LOGIN_PATH && session?.userId && session?.role) {
      console.log(`[Middleware] Path is ADMIN_LOGIN_PATH. Session is VALID. Redirecting to dashboard.`);
      return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
    }
    // Otherwise, allow access to the public admin page (e.g., login page with no session, or other future public admin pages)
    console.log(`[Middleware] Path "${pathname}" is PUBLIC admin path. Allowing access (e.g. login page for non-logged-in user).`);
    return NextResponse.next();
  }

  // Fallback, should ideally not be reached if admin path logic is comprehensive
  console.warn(`[Middleware] Path "${pathname}" is an admin path but did not match protected/public conditions. Allowing by default (review logic).`);
  return NextResponse.next();
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
