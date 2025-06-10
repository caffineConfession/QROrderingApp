
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
  console.log(`[Middleware] Path: ${pathname}`);

  // If it's not an admin path, let it pass
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('admin_session')?.value;
  console.log(`[Middleware] Admin session cookie value: ${sessionCookie ? '******' : 'not found'}`); // Don't log actual cookie value

  const session = await decryptSession(sessionCookie);
  console.log(`[Middleware] Decrypted session object:`, session);


  // If trying to access a protected admin page without a session, redirect to login
  if (!session?.role && !PUBLIC_ADMIN_PATHS.includes(pathname)) {
    console.log(`[Middleware] No session/role, and path "${pathname}" is not public. Redirecting to login.`);
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
  }

  // If there's a session and trying to access login page, redirect to dashboard
  if (session?.role && pathname === ADMIN_LOGIN_PATH) {
    console.log(`[Middleware] Session exists and user is on login page. Redirecting to dashboard.`);
    return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
  }
  
  // TODO: Add role-based access control here if needed for specific admin sub-paths
  // For example:
  // if (session?.role !== 'BUSINESS_MANAGER' && pathname.startsWith('/admin/analytics')) {
  //   console.log(`[Middleware] Role ${session?.role} attempting to access ${pathname}. Denied. Redirecting to dashboard.`);
  //   return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url)); // Or a specific "access denied" page
  // }

  console.log(`[Middleware] Access allowed for path: ${pathname}`);
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

