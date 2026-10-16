import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const appUrl = getAppUrl();
  if (!appUrl || !getSupabaseConfig()) {
    return new NextResponse("Authentication is not configured.", { status: 503 });
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/setup", appUrl));
  }

  return NextResponse.redirect(new URL("/sign-in?error=verification", appUrl));
}