import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
export const dynamic = "force-dynamic";
export default async function WorkspacePage() {
  if (!getSupabaseConfig()) redirect("/settings");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/settings");
  if (user.user_metadata?.intent === "customer") redirect("/customer");
  const { data: businesses, error } = await supabase.from("businesses").select("business_type").limit(10);
  if (error) redirect("/settings");
  if (businesses?.some(row => row.business_type === "trading")) redirect("/retailer");
  if (businesses?.some(row => row.business_type === "tailor")) redirect("/tailor");
  redirect(user.user_metadata?.intent === "trading" ? "/setup?type=trading" : "/setup?type=tailor");
}