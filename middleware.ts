import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token && (pathname.startsWith("/employee") || pathname.startsWith("/manager") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    const userRole = token.role as string;

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
