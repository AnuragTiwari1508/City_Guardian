import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || 
                       path === '/register' || 
                       path === '/' || 
                       path === '/api/health' ||
                       path.startsWith('/api/auth');

  // Get the token from the cookies
  const token = request.cookies.get('next-auth.session-token')?.value || 
                request.cookies.get('__Secure-next-auth.session-token')?.value || '';

  // AWS-specific headers for better performance
  const response = NextResponse.next();
  
  // Add security headers for AWS deployment
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add AWS-specific caching headers
  if (path.startsWith('/static') || path.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Redirect authenticated users away from login/register pages
  if (isPublicPath && token && !path.startsWith('/api')) {
    return NextResponse.redirect(new URL('/citizen/dashboard', request.url));
  }

  // Redirect unauthenticated users to login page
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Health check for AWS load balancers
  if (path === '/health' || path === '/api/health') {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|assets).*)',
  ],
};