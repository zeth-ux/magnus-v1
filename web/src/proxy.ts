import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Pages that need a signed-in user. */
const PROTECTED_PATHS = ["/welcome", "/me", "/add", "/browse", "/activity"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Runs before matching requests (Next 16 renamed "middleware" to "proxy").
 * 1. Refreshes the Supabase session cookie so pages see a valid session.
 * 2. Optimistically sends signed-out visitors away from protected pages.
 *    Pages still check the user themselves; this is only a fast first gate.
 */
export async function proxy(request: NextRequest) {
  // The landing page is static and needs no session: keep it fast.
  if (request.nextUrl.pathname === "/") return NextResponse.next();

  const env = getSupabaseEnv();
  const isProtected = isProtectedPath(request.nextUrl.pathname);

  if (!env) {
    return isProtected ? redirectToLogin(request) : NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Responses that set auth cookies must never be cached by a CDN.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() validates the session token (and refreshes it if needed).
  // Don't put other code between creating the client and this call.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (isProtected && !signedIn) return redirectToLogin(request, response);
  return response;
}

/**
 * Sends the visitor to /login, remembering where they were going.
 * Copies any cookies Supabase just set (e.g. clearing a dead session) onto the
 * redirect, so a rejected refresh token isn't retried on every request.
 */
function redirectToLogin(request: NextRequest, from?: NextResponse) {
  const url = request.nextUrl.clone();
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(next)}`;
  const redirect = NextResponse.redirect(url);
  from?.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  from?.headers.forEach((value, key) => {
    if (["cache-control", "expires", "pragma"].includes(key)) redirect.headers.set(key, value);
  });
  return redirect;
}

export const config = {
  // Skip static files, images and the PWA icons/manifest.
  matcher: [
    "/((?!_next/static|_next/image|icons/|sw\\.js|offline\\.html|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
