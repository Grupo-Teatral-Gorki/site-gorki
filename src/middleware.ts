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
  const isCasaFechada = pathname.startsWith('/eventos/casa-fechada');
  // Allow payment-related routes (MP success/failure and ticket views/validation)
  const isPaymentRoutes = (
    pathname.startsWith('/payment-success') ||
    pathname.startsWith('/payment-failure') ||
    pathname.startsWith('/ingressos') ||
    pathname.startsWith('/validate') ||
    pathname.startsWith('/validar-ingresso')
  );

  if (isAdmin || isApi || isNext || isStaticAsset || isFavicon || isRobots || isCasaFechada || isPaymentRoutes) {
    return NextResponse.next();
  }

  // Only redirect in production. In development/localhost, allow normal routing.
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/eventos/casa-fechada';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Run on all paths
    '/:path*',
  ],
};
