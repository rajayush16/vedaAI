import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sessionCookieName } from "./src/lib/constants";

const PROTECTED_MATCHER = /^\/assignments(\/.*)?$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(sessionCookieName);

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/assignments", request.url));
  }

  if (PROTECTED_MATCHER.test(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/assignments/:path*"],
};
