// export { auth as middleware } from "./auth"

import { auth } from "@lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // If the user is not logged in and trying to access a protected route
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Specify which routes should be protected
export const config = {
  matcher: [
    // Add your protected routes here
    '/dashboard/:path*',
    '/profile/:path*',
    // Exclude authentication routes
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
};