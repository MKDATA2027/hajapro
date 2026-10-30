import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getSupabaseConfig } from "@/lib/supabase/config";

type Intent = "tailor" | "trading" | "customer";
const isIntent = (value: string | null): value is Intent =>
  value === "tailor" || value === "trading" || value === "customer";
const routeFor = (intent: Intent) => intent === "trading" ? "/retailer" : `/${intent}`;

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

  // An established account's role takes precedence over the role selected at sign-in.
  const storedIntent = user.user_metadata?.intent;
  if (isIntent(storedIntent)) return NextResponse.redirect(new URL(routeFor(storedIntent), appUrl));

  // For legacy accounts, infer the workspace through the user's existing RLS-scoped rows.
  const { data: businesses, error: businessError } = await supabase
    .from("businesses").select("business_type").limit(10);
  if (businessError) return NextResponse.redirect(new URL("/settings?error=workspace-check", appUrl));
  if (businesses?.some(row => row.business_type === "trading")) return NextResponse.redirect(new URL("/retailer", appUrl));
  if (businesses?.some(row => row.business_type === "tailor")) return NextResponse.redirect(new URL("/tailor", appUrl));

  const intent: Intent = isIntent(requestedIntent) ? requestedIntent : "tailor";
  const { error: metadataError } = await supabase.auth.updateUser({ data: { intent } });
  if (metadataError) return NextResponse.redirect(new URL("/settings?error=account-setup", appUrl));
  return NextResponse.redirect(new URL(routeFor(intent), appUrl));
}
