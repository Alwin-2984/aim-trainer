import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const isAuth = !!token;
  
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some((route) => req.nextUrl.pathname.startsWith(route));

  // 1. If an authenticated user tries to visit a login/register page, 
  // redirect them to the home page (or dashboard)
  if (isAuthRoute) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    // Let unauthenticated users pass to the auth pages
    return NextResponse.next();
  }

  // 2. Based on the config matcher below, any other intercepted route is a protected route.
  // If the user is unauthenticated, redirect them to the login page.
  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  // Add any protected routes or auth routes here. 
  // This tells Next.js to only run the middleware on these specific paths.
  matcher: [
    '/login',
    '/register',
    '/flick/:path*',
    '/tracking/:path*',
    '/micro-adjustment/:path*',
  ],
};
