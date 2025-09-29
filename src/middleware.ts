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

  if (isAdmin || isApi || isNext || isStaticAsset || isFavicon || isRobots || isDesventuras) {
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
