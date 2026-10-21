import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { DashboardHome } from "@/app/workspace/dashboard-home";
import { signOutAction } from "@/app/auth/actions";
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
      <header className="workspace-header dashboard-mobile-header">
        <Link className="workspace-logo-link" href="/" aria-label="HAJAPRO home"><Image className="workspace-logo-image" src="/branding/hajapro-master-logo.jpg" alt="HAJAPRO — Product of MK Company" width={1536} height={1499} priority /></Link>
        <form action={signOutAction}>
          <button className="icon-text-button" type="submit"><LogOut size={16} /> Sign out</button>
        </form>
      </header>
      <DashboardHome businessName={business.name} businessType={business.business_type} customers={customerRows ?? []} measurements={measurementRows ?? []} />
    </main>
  );
}
