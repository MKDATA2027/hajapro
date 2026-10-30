import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getSupabaseConfig } from "@/lib/supabase/config";

type Intent = "tailor" | "trading" | "customer";
const isIntent = (value: string | null): value is Intent =>
  value === "tailor" || value === "trading" || value === "customer";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedIntent = request.nextUrl.searchParams.get("type");
  const appUrl = getAppUrl();
  if (!appUrl || !getSupabaseConfig()) return new NextResponse("Authentication is not configured.", { status: 503 });
  if (!code) return NextResponse.redirect(new URL("/settings?error=google-sign-in", appUrl));

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(new URL("/settings?error=google-sign-in", appUrl));

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.redirect(new URL("/settings?error=google-sign-in", appUrl));

  // Explicit intent from this sign-in flow takes precedence over previous
  // metadata and workspace membership. A Customer must never be redirected
  // into the business onboarding form.
  const storedIntent = user.user_metadata?.intent;
  const intent: Intent = isIntent(requestedIntent)
    ? requestedIntent
    : storedIntent === "trading" || storedIntent === "customer"
      ? storedIntent
      : "tailor";

  const { error: metadataError } = await supabase.auth.updateUser({ data: { intent } });
  if (metadataError) return NextResponse.redirect(new URL("/settings?error=account-setup", appUrl));

  if (intent === "customer") return NextResponse.redirect(new URL("/customer", appUrl));

  const { data: businesses, error: businessError } = await supabase
    .from("businesses")
    .select("id, business_type")
    .limit(10);
  if (businessError) return NextResponse.redirect(new URL("/settings?error=workspace-check", appUrl));

  if (businesses?.some(row => row.business_type === intent)) {
    return NextResponse.redirect(new URL("/workspace", appUrl));
  }
  if (businesses?.length) {
    return NextResponse.redirect(new URL(`/setup?type=${intent}&error=workspace-type-conflict`, appUrl));
  }
  return NextResponse.redirect(new URL(`/setup?type=${intent}`, appUrl));
}
