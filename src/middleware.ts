import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// RBAC Route Map — defines which roles can access which routes.
// ---------------------------------------------------------------------------
const ROLE_ACCESS: Record<string, string[]> = {
  // Financial pages — Owner, Admin, Accountant only
  "/reports":        ["OWNER", "ADMIN", "ACCOUNTANT"],
  "/reconciliation": ["OWNER", "ADMIN", "ACCOUNTANT"],
  "/pricing":        ["OWNER", "ADMIN", "ACCOUNTANT"],
  "/settings":       ["OWNER", "ADMIN"],
  "/audit":          ["OWNER", "ADMIN"],

  // Production & Inventory — everyone
  "/products":       ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"],
  "/raw-materials":  ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"],
  "/production":     ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"],
  "/vendors":        ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"],
  "/orders":         ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"],
  "/returns":        ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"],
  "/glossary":       ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"],
  "/":               ["OWNER", "ADMIN", "ACCOUNTANT", "STAFF"],
};

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and static assets
  if (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Create Supabase client with cookie handling for middleware
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (IMPORTANT — keeps the session alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Not logged in → redirect to /login ──
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ── RBAC Check ──
  // Get user role from the `users` table metadata (set during signup/invitation)
  const userRole =
    (user.user_metadata?.role as string) || "STAFF";

  // Find the matching route rule
  const matchedRoute = Object.keys(ROLE_ACCESS).find((route) =>
    pathname === route || (route !== "/" && pathname.startsWith(route))
  );

  if (matchedRoute) {
    const allowedRoles = ROLE_ACCESS[matchedRoute];
    if (!allowedRoles.includes(userRole)) {
      // User does not have permission → redirect to dashboard with error
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
