import { redirect } from "next/navigation";
import { RetailerDashboard } from "@/app/retailer/retailer-dashboard";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RetailerPage() {
  if (!getSupabaseConfig()) redirect("/settings?experience=trading");
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/settings?experience=trading");

  if (user.user_metadata?.intent !== "trading") {
    redirect("/settings?experience=trading");
  }

  const { data: businesses, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, business_type")
    .eq("business_type", "trading")
    .order("created_at", { ascending: true })
    .limit(1);
  if (businessError) {
    return <main className="setup-shell"><h1>Retailer dashboard unavailable</h1><p>We could not load your authorized trading workspace. Please try again later.</p></main>;
  }
  const business = businesses?.[0];
  if (!business) redirect("/setup?type=trading");

  const [{ data: membership, error: membershipError }, { data: products, error: productsError }, { count: customerCount, error: customerError }] = await Promise.all([
    supabase.from("business_members").select("role").eq("business_id", business.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("products").select("id, name, sku, unit_price, stock_quantity, low_stock_threshold").eq("business_id", business.id).order("name", { ascending: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", business.id),
  ]);

  if (membershipError || !membership) {
    return <main className="setup-shell"><h1>Access restricted</h1><p>This account is not a member of the selected trading workspace.</p></main>;
  }
  if (productsError || customerError) {
    return <main className="setup-shell"><h1>Trading data unavailable</h1><p>We could not load all dashboard data. Refresh the page or contact your workspace administrator.</p></main>;
  }

  return (
    <main className="workspace-page dashboard-page trading-page">
      <RetailerDashboard
        businessName={business.name}
        role={membership.role}
        products={products ?? []}
        customerCount={customerCount ?? 0}
        todayPaymentCount={0}
        hasSalesSource={false}
      />
    </main>
  );
}
