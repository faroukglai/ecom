import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Two jobs:
 *  - /dashboard/*  keeps the Supabase session fresh and sends logged-out visitors to the login page.
 *  - everything else is the public storefront: French lives at the root (/shop), Arabic under /ar (/ar/shop).
 *    The storefront does no Supabase work here, so public pages stay fast and cacheable.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/dashboard" || path.startsWith("/dashboard/")) return dashboardProxy(request);
  return storefrontProxy(request);
}

function storefrontProxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  if (path === "/ar" || path.startsWith("/ar/")) return NextResponse.next();

  // /fr/... is the internal French route; the public URL has no prefix.
  if (path === "/fr" || path.startsWith("/fr/")) {
    url.pathname = path.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  // Returning Arabic visitors land on the Arabic site.
  if (request.cookies.get("store_lang")?.value === "ar") {
    url.pathname = path === "/" ? "/ar" : `/ar${path}`;
    return NextResponse.redirect(url);
  }

  url.pathname = path === "/" ? "/fr" : `/fr${path}`;
  return NextResponse.rewrite(url);
}

async function dashboardProxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const path = request.nextUrl.pathname;
  const isLogin = path === "/dashboard/login";

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie.name, cookie.value));
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = supabaseResponse.headers.get(header);
      if (value) redirect.headers.set(header, value);
    }
    return redirect;
  };

  if (!isLogin && !user) return redirectTo("/dashboard/login");
  if (isLogin && user) return redirectTo("/dashboard");
  return supabaseResponse;
}

export const config = {
  // Skip Next internals, the API and anything with a file extension (images, fonts, icons, sitemap, robots).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
