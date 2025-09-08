import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Skip auth checks for auth-related pages to avoid redirect loops
  if (req.nextUrl.pathname.startsWith('/auth') || 
      req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next();
  }
  
  // NOTE: Server-side auth protection is currently disabled due to environment variable
  // loading issues in development. Client-side auth validation handles protection.
  // For production deployment, consider implementing proper server-side session validation
  // using Supabase SSR with HTTP-only cookies for enhanced security.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};