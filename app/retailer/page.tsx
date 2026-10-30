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

  // Resolve the workspace through the signed-in user's membership.
  // If an account belongs to multiple trading shops, never guess which data to show.
  const { data: memberships, error: membershipError } = await supabase
    .from("business_members")
    .select("role, businesses!inner(id, name, business_type)")
    .eq("user_id", user.id)
    .eq("businesses.business_type", "trading")
    .limit(2);

  if (membershipError) {
    return <main className="setup-shell"><h1>Retailer dashboard unavailable</h1><p>We could not load your authorized trading workspace. Please try again later.</p></main>;
  }
  if (!memberships?.length) redirect("/setup?type=trading");
  if (memberships.length > 1) {
    return <main className="setup-shell"><h1>Choose your trading workspace</h1><p>This account belongs to more than one trading business. Select a workspace before viewing business data.</p></main>;
  }

  const membership = memberships[0];
  const business = membership.businesses as unknown as {
    id: string; name: string; business_type: "trading" | "tailor";
  };
  if (business.business_type !== "trading") redirect("/settings?experience=trading");

  const [{ data: products, error: productsError }, { count: customerCount, error: customerError }] = await Promise.all([
    supabase.from("products")
      .select("id, name, sku, unit_price, stock_quantity, low_stock_threshold")
      .eq("business_id", business.id)
      .order("name", { ascending: true }),
    supabase.from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
  ]);

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
