import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST only, so a link or image on another site can't sign people out.
 * Route handlers (unlike Server Actions) don't check where a POST came from,
 * so we reject cross-site form posts ourselves.
 */
export async function POST(request: NextRequest) {
  const home = new URL("/", request.url);
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== request.nextUrl.origin) {
    return NextResponse.redirect(home, { status: 303 });
  }

  const supabase = await createSupabaseServerClient();
  // "local" signs out this browser only, not the PWA on your phone too.
  if (supabase) await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(home, { status: 303 });
}
