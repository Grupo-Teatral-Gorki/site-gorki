import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow admin and API/internals
  const isAdmin = pathname.startsWith('/admin');
  const isApi = pathname.startsWith('/api');
  const isNext = pathname.startsWith('/_next');
  const isStaticAsset = pathname.match(/\.(.*)$/); // files like .png, .jpg, .css, .js, etc.
  const isFavicon = pathname === '/favicon.ico';
  const isRobots = pathname === '/robots.txt' || pathname === '/sitemap.xml';
  const isDesventuras = pathname.startsWith('/desventuras');
  // Allow payment-related routes (MP success/failure and ticket views/validation)
  const isPaymentRoutes = (
    pathname.startsWith('/payment-success') ||
    pathname.startsWith('/payment-failure') ||
    pathname.startsWith('/ingressos') ||
    pathname.startsWith('/validate') ||
    pathname.startsWith('/validar-ingresso')
  );

  if (isAdmin || isApi || isNext || isStaticAsset || isFavicon || isRobots || isDesventuras || isPaymentRoutes) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/desventuras';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Run on all paths
    '/:path*',
  ],
};
