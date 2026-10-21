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

  return (
    <main className="workspace-page dashboard-page">
      <DashboardHome businessName={business.name} businessType={business.business_type} businessId={business.id} customers={customerRows ?? []} measurements={measurementRows ?? []} />
    </main>
  );
}
