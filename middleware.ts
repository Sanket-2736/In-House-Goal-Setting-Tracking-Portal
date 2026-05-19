import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Get token with secret from environment
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token and trying to access protected routes, redirect to login
  if (!token && (pathname.startsWith("/employee") || pathname.startsWith("/manager") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If token exists, check role-based access
  if (token) {
    const userRole = token.role as string;

    // Role-based route protection
    if (pathname.startsWith("/employee")) {
      if (userRole !== "employee" && userRole !== "manager" && userRole !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    if (pathname.startsWith("/manager")) {
      if (userRole !== "manager" && userRole !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    if (pathname.startsWith("/admin")) {
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Redirect root to appropriate dashboard
    if (pathname === "/" || pathname === "/dashboard") {
      if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (userRole === "manager") {
        return NextResponse.redirect(new URL("/manager", request.url));
      } else if (userRole === "employee") {
        return NextResponse.redirect(new URL("/employee", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/employee/:path*",
    "/manager/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
  ],
};
