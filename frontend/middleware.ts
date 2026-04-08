import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /admin, /api/admin, and /api/scrape routes, except /admin/login and /api/admin/auth
  if (
    (path.startsWith('/admin') && path !== '/admin/login') ||
    (path.startsWith('/api/admin') && path !== '/api/admin/auth') ||
    path.startsWith('/api/scrape')
  ) {
    const token = request.cookies.get('ADMIN_TOKEN')?.value;

    if (!token || token !== 'authenticated') {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Redirect /admin/login to /admin if already logged in
  if (path === '/admin/login') {
    const token = request.cookies.get('ADMIN_TOKEN')?.value;
    if (token === 'authenticated') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/scrape/:path*'],
};
