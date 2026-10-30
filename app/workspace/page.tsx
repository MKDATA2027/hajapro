import { redirect } from "next/navigation";
import { DashboardHome } from "@/app/workspace/dashboard-home";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  if (!getSupabaseConfig()) redirect("/settings");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/settings");
  const { data: businesses, error: businessError } = await supabase.from("businesses")
    .select("id, name, business_type").order("created_at", { ascending: true });
  if (businessError) return <main className="setup-shell"><h1>Workspace unavailable</h1><p>We could not load your authorized workspace.</p></main>;
  if (!businesses?.length) redirect("/setup");
  const business = businesses[0];
  const [{ data: customerRows }, { data: measurementRows }, { data: orderRows }, { data: productRows }, { data: paymentRows }, { data: notificationRows }] = await Promise.all([
    supabase.from("customers").select("id, full_name, phone, email, created_at").eq("business_id", business.id).order("created_at", { ascending: false }),
    supabase.from("measurements").select("id, customer_id, label, measurement_values, unit, recorded_at, notes").eq("business_id", business.id).order("recorded_at", { ascending: false }),
    supabase.from("orders").select("id, title, status, total_amount, deposit_amount, due_date, created_at, customer_id").eq("business_id", business.id).order("created_at", { ascending: false }),
    supabase.from("products").select("id, name, sku, category, unit_price, stock_quantity, low_stock_threshold").eq("business_id", business.id).order("name", { ascending: true }),
    supabase.from("order_payments").select("id, order_id, amount, payment_method, status, created_at, verified_at").eq("business_id", business.id).order("created_at", { ascending: false }),
    supabase.from("app_notifications").select("id, title, body, read_at, created_at").eq("business_id", business.id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);
  // Photo columns are introduced by a separate additive migration. If it has not
  // been applied yet, continue to show all existing customer records without photos.
  const { data: photoRows } = await supabase.from("customers")
    .select("id, customer_photo_path, garment_photo_path").eq("business_id", business.id);
  const photoByCustomer = new Map((photoRows ?? []).map(row => [row.id, row]));
  const customers = await Promise.all((customerRows ?? []).map(async customer => {
    const paths = photoByCustomer.get(customer.id);
    const [customerPhoto, garmentPhoto] = await Promise.all([
      paths?.customer_photo_path ? supabase.storage.from("customer-media").createSignedUrl(paths.customer_photo_path, 3600) : Promise.resolve({ data: null }),
      paths?.garment_photo_path ? supabase.storage.from("customer-media").createSignedUrl(paths.garment_photo_path, 3600) : Promise.resolve({ data: null }),
    ]);
    return { id: customer.id, full_name: customer.full_name, phone: customer.phone, email: customer.email, created_at: customer.created_at,
      customer_photo_url: customerPhoto.data?.signedUrl ?? null, garment_photo_url: garmentPhoto.data?.signedUrl ?? null };
  }));
  return <main className="workspace-page dashboard-page"><DashboardHome businessType={business.business_type} businessId={business.id} customers={customers}
    measurements={measurementRows ?? []} orders={orderRows ?? []} products={productRows ?? []} payments={paymentRows ?? []} notifications={notificationRows ?? []}/></main>;
}
