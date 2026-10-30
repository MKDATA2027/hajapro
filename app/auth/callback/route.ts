import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const appUrl = getAppUrl();
  if (!appUrl || !getSupabaseConfig()) return new NextResponse("Authentication is not configured.", { status: 503 });
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const intent = user?.user_metadata?.intent;
      const path = intent === "trading" ? "/retailer" : intent === "customer" ? "/customer" : "/tailor";
      return NextResponse.redirect(new URL(path, appUrl));
    }
  }
  return NextResponse.redirect(new URL("/sign-in?error=verification", appUrl));
}