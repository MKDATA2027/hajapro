"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CustomerFormState = { error?: string; success?: string };
const PHOTO_BUCKET = "customer-media";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const photoTypes = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);

async function uploadCustomerPhoto(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  file: FormDataEntryValue | null,
  businessId: string,
  userId: string,
  kind: "customer" | "garment",
): Promise<{ path?: string; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return {};
  const extension = photoTypes.get(file.type);
  if (!extension) return { error: "Use a JPG, PNG or WebP image." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "Each photo must be 5 MB or smaller." };
  const path = `${businessId}/${userId}/${crypto.randomUUID()}-${kind}.${extension}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type, cacheControl: "3600", upsert: false,
  });
  if (error) return { error: "Photo upload failed. Check that the customer-media storage migration has been applied." };
  return { path };
}

export async function createCustomerAction(_previous: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 120) return { error: "Enter a customer name between 2 and 120 characters." };
  if (phone.length > 40) return { error: "Phone number is too long." };
  if (email.length > 254) return { error: "Email address is too long." };
  if (notes.length > 2000) return { error: "Notes must be 2,000 characters or fewer." };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Your session has expired. Sign in again." };
  const businessId = String(formData.get("business_id") ?? "").trim();
  if (!businessId) return { error: "Business workspace is missing. Refresh and try again." };
  const { data: membership, error: membershipError } = await supabase.from("business_members")
    .select("business_id").eq("user_id", user.id).eq("business_id", businessId).maybeSingle();
  if (membershipError || !membership) return { error: "You do not have access to this business workspace." };

  const customerPhoto = await uploadCustomerPhoto(supabase, formData.get("customer_photo"), businessId, user.id, "customer");
  if (customerPhoto.error) return { error: customerPhoto.error };
  const garmentPhoto = await uploadCustomerPhoto(supabase, formData.get("garment_photo"), businessId, user.id, "garment");
  if (garmentPhoto.error) {
    if (customerPhoto.path) await supabase.storage.from(PHOTO_BUCKET).remove([customerPhoto.path]);
    return { error: garmentPhoto.error };
  }

  const { error } = await supabase.from("customers").insert({
    business_id: membership.business_id, full_name: fullName, phone: phone || null,
    email: email || null, notes: notes || null, created_by: user.id,
    customer_photo_path: customerPhoto.path ?? null, garment_photo_path: garmentPhoto.path ?? null,
  });
  if (error) {
    const paths = [customerPhoto.path, garmentPhoto.path].filter((value): value is string => Boolean(value));
    if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    if (error.code === "42P01" || error.code === "PGRST205") return { error: "Customer photo database migration is not available yet." };
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
  const { data: membership } = await supabase.from("business_members").select("business_id")
    .eq("user_id", user.id).eq("business_id", customer.business_id).maybeSingle();
  if (!membership) return { error: "You do not have access to this customer." };
  const { error } = await supabase.from("measurements").insert({
    business_id: customer.business_id, customer_id: customer.id, label,
    measurement_values: values, unit, notes: notes || null, created_by: user.id,
  });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return { error: "Measurements are not available yet. Apply the database migration first." };
    return { error: "Measurements could not be saved. Check the entries and try again." };
  }
  revalidatePath("/workspace");
  return { success: "Measurements saved successfully." };
}
