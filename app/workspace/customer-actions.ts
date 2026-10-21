"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CustomerFormState = { error?: string; success?: string };

export async function createCustomerAction(_previous: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 120) return { error: "Enter a customer name between 2 and 120 characters." };
  if (phone.length > 40) return { error: "Phone number is too long." };
  if (email.length > 254) return { error: "Email address is too long." };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Your session has expired. Sign in again." };

  const { data: memberships, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id, businesses(id, name, business_type, created_at)")
    .eq("user_id", user.id);
  if (membershipError) return { error: "Could not load your business access. Please try again." };
  const membership = memberships?.[0];
  if (!membership?.business_id) return { error: "No business workspace is connected to this account." };

  const { error } = await supabase.from("customers").insert({
    business_id: membership.business_id,
    full_name: fullName,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
    created_by: user.id,
  });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return { error: "Customer records are not available yet. The database migration must be applied first." };
    return { error: "Customer could not be saved. Check the details and try again." };
  }

  revalidatePath("/workspace");
  return { success: "Customer saved successfully." };
}
