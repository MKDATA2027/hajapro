import { redirect } from "next/navigation";
import { DashboardHome } from "@/app/workspace/dashboard-home";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  if (!getSupabaseConfig()) redirect("/sign-in");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  if (user.user_metadata?.intent === "customer") redirect("/setup");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, business_type")
    .order("created_at", { ascending: true });
  if (!businesses?.length) redirect("/setup");

  const business = businesses[0];
  const { data: customerRows } = await supabase
    .from("customers")
    .select("id, full_name, phone, email, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  const { data: measurementRows } = await supabase
    .from("measurements")
    .select("id, customer_id, label, measurement_values, unit, recorded_at, notes")
    .eq("business_id", business.id)
    .order("recorded_at", { ascending: false });

  const [{ data: orderRows }, { data: productRows }, { data: paymentRows }, { data: notificationRows }] = await Promise.all([
    supabase.from("orders").select("id, title, status, total_amount, deposit_amount, due_date, created_at, customer_id").eq("business_id", business.id).order("created_at", { ascending: false }),
    supabase.from("products").select("id, name, sku, category, unit_price, stock_quantity, low_stock_threshold").eq("business_id", business.id).order("name", { ascending: true }),
    supabase.from("order_payments").select("id, order_id, amount, payment_method, status, created_at").eq("business_id", business.id).order("created_at", { ascending: false }),
    supabase.from("app_notifications").select("id, title, body, read_at, created_at").eq("business_id", business.id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <main className="workspace-page dashboard-page">
      <DashboardHome businessType={business.business_type} businessId={business.id} customers={customerRows ?? []} measurements={measurementRows ?? []} orders={orderRows ?? []} products={productRows ?? []} payments={paymentRows ?? []} notifications={notificationRows ?? []} />
    </main>
  );
}
