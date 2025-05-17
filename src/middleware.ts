
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

  // If it's not an admin path, let it pass
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);

  // If trying to access a protected admin page without a session, redirect to login
  if (!session?.role && !PUBLIC_ADMIN_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
  }

  // If there's a session and trying to access login page, redirect to dashboard
  if (session?.role && pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
  }
  
  // TODO: Add role-based access control here if needed for specific admin sub-paths
  // For example:
  // if (session?.role !== 'BUSINESS_MANAGER' && pathname.startsWith('/admin/analytics')) {
  //   return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url)); // Or a specific "access denied" page
  // }

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
