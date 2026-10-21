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

  const businessId = String(formData.get("business_id") ?? "").trim();
  if (!businessId) return { error: "Business workspace is missing. Refresh and try again." };
  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .eq("business_id", businessId)
    .maybeSingle();
  if (membershipError || !membership) return { error: "You do not have access to this business workspace." };

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


export async function createMeasurementAction(_previous: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const customerId = String(formData.get("customer_id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const unit = String(formData.get("unit") ?? "inches");
  const notes = String(formData.get("measurement_notes") ?? "").trim();
  const fields = ["chest", "waist", "hip", "shoulder", "sleeve", "length"] as const;
  const values: Record<string, number> = {};
  for (const field of fields) {
    const raw = String(formData.get(field) ?? "").trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0 || value > 1000) return { error: "Enter valid positive numbers for measurements." };
    values[field] = value;
  }
  if (!customerId) return { error: "Choose a valid customer." };
  if (label.length < 2 || label.length > 100) return { error: "Measurement set name must be 2–100 characters." };
  if (!Object.keys(values).length) return { error: "Enter at least one measurement." };
  if (unit !== "inches" && unit !== "cm") return { error: "Choose inches or centimetres." };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Your session has expired. Sign in again." };

  const { data: customer, error: customerError } = await supabase.from("customers")
    .select("id, business_id").eq("id", customerId).maybeSingle();
  if (customerError || !customer) return { error: "Customer not found in your authorized workspace." };

  const { error } = await supabase.from("measurements").insert({
    business_id: customer.business_id,
    customer_id: customer.id,
    label,
    measurement_values: values,
    unit,
    notes: notes || null,
    created_by: user.id,
  });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return { error: "Measurements are not available yet. Apply the database migration first." };
    return { error: "Measurements could not be saved. Check the entries and try again." };
  }
  revalidatePath("/workspace");
  return { success: "Measurements saved successfully." };
}
