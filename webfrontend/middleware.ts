import { NextResponse, NextRequest } from 'next/server';

/**
 * Workshop Next.js Middleware
 * Comprehensive Route Guard System synchronized with Sidebar permissions.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('workshop_token')?.value;
  const permissions = request.cookies.get('workshop_permissions')?.value || "";
  const { pathname } = request.nextUrl;

  const userPerms = permissions.split(',');
  const hasInfinitePerm = userPerms.includes('*');

  // 1. Authentication Check
  if (!token && pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Auth Flow Redirection
  if (token && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  // 3. Permission-Based Route Guarding (Full Coverage)
  if (token && !hasInfinitePerm) {
    
    // Comprehensive matching of module paths to required permission slugs
    const protectedPaths: Record<string, string> = {
      '/app/repairs/create': 'create:repair',
      '/app/repairs': 'view:repairs',
      '/app/vehicles': 'view:vehicles',
      '/app/users': 'view:users',
      '/app/customers': 'view:customers',
      '/app/shops': 'view:shops',
      '/app/roles': 'view:role',
      '/app/permissions': 'view:permission',
      '/app/invoices': 'view:invoices',
      '/app/reports': 'view:reports',
      '/app/settings': 'manage:settings',
      '/app/profile': 'view:profile' // Basic self-access usually allowed, but explicitly listed
    };

    // Sorted descending by length to match specific sub-paths first
    const sortedPaths = Object.keys(protectedPaths).sort((a, b) => b.length - a.length);
    const matchedPath = sortedPaths.find(p => pathname.startsWith(p));

    if (matchedPath) {
      const requiredPerm = protectedPaths[matchedPath];
      
      // Special exclusion: dashboard itself usually public to all authenticated
      if (matchedPath === '/app' && pathname === '/app') {
        return NextResponse.next();
      }

      if (!userPerms.includes(requiredPerm)) {
        // Log unauthorized attempt and redirect
        console.warn(`[Guard] Blocked access to ${pathname} - Missing: ${requiredPerm}`);
        return NextResponse.redirect(new URL('/app', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login', '/signup', '/'],
};
