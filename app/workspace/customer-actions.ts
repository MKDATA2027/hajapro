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
  ha: boolean,
): Promise<{ path?: string; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return {};
  const extension = photoTypes.get(file.type);
  if (!extension) return { error: ha ? "Yi amfani da hoton JPG, PNG ko WebP." : "Use a JPG, PNG or WebP image." };
  if (file.size > MAX_PHOTO_BYTES) return { error: ha ? "Kowane hoto bai kamata ya wuce 5 MB ba." : "Each photo must be 5 MB or smaller." };
  const path = `${businessId}/${userId}/${crypto.randomUUID()}-${kind}.${extension}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type, cacheControl: "3600", upsert: false,
  });
  if (error) return { error: ha ? "An kasa loda hoton. A tabbatar an aiwatar da migration na hotunan kwastoma." : "Photo upload failed. Check that the customer-media storage migration has been applied." };
  return { path };
}

export async function createCustomerAction(_previous: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const ha = formData.get("language") === "ha";
  const msg = (en: string, haText: string) => ha ? haText : en;
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 120) return { error: msg("Enter a customer name between 2 and 120 characters.", "Shigar da sunan kwastoma mai haruffa 2 zuwa 120.") };
  if (phone.length > 40) return { error: msg("Phone number is too long.", "Lambar waya ta yi tsawo.") };
  if (email.length > 254) return { error: msg("Email address is too long.", "Adireshin imel ya yi tsawo.") };
  if (notes.length > 2000) return { error: msg("Notes must be 2,000 characters or fewer.", "Ƙarin bayani bai kamata ya wuce haruffa 2,000 ba.") };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: msg("Your session has expired. Sign in again.", "Lokacin shiga ya ƙare. Sake shiga asusunka.") };
  const businessId = String(formData.get("business_id") ?? "").trim();
  if (!businessId) return { error: msg("Business workspace is missing. Refresh and try again.", "Ba a gano wurin kasuwancinka ba. Sake loda shafin ka gwada.") };
  const { data: membership, error: membershipError } = await supabase.from("business_members")
    .select("business_id").eq("user_id", user.id).eq("business_id", businessId).maybeSingle();
  if (membershipError || !membership) return { error: msg("You do not have access to this business workspace.", "Ba ka da izinin shiga wannan wurin kasuwanci.") };

  const customerPhoto = await uploadCustomerPhoto(supabase, formData.get("customer_photo"), businessId, user.id, "customer", ha);
  if (customerPhoto.error) return { error: customerPhoto.error };
  const garmentPhoto = await uploadCustomerPhoto(supabase, formData.get("garment_photo"), businessId, user.id, "garment", ha);
  if (garmentPhoto.error) {
    if (customerPhoto.path) await supabase.storage.from(PHOTO_BUCKET).remove([customerPhoto.path]);
    return { error: garmentPhoto.error };
  }

  const customerRow: {
    business_id: string; full_name: string; phone: string | null; email: string | null;
    notes: string | null; created_by: string; customer_photo_path?: string | null; garment_photo_path?: string | null;
  } = {
    business_id: membership.business_id, full_name: fullName, phone: phone || null,
    email: email || null, notes: notes || null, created_by: user.id,
  };
  if (customerPhoto.path) customerRow.customer_photo_path = customerPhoto.path;
  if (garmentPhoto.path) customerRow.garment_photo_path = garmentPhoto.path;
  const { error } = await supabase.from("customers").insert(customerRow);
  if (error) {
    const paths = [customerPhoto.path, garmentPhoto.path].filter((value): value is string => Boolean(value));
    if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    if (error.code === "42P01" || error.code === "PGRST205") return { error: msg("Customer photo database migration is not available yet.", "Ba a aiwatar da tsarin hotunan kwastoma a database ba tukuna.") };
    return { error: msg("Customer could not be saved. Check the details and try again.", "An kasa ajiye kwastoma. Duba bayanan sannan ka sake gwadawa.") };
  }
  revalidatePath("/workspace");
  return { success: msg("Customer saved successfully.", "An ajiye bayanan kwastoma cikin nasara.") };
}

export async function createMeasurementAction(_previous: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const ha = formData.get("language") === "ha";
  const msg = (en: string, haText: string) => ha ? haText : en;
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
    if (!Number.isFinite(value) || value <= 0 || value > 1000) return { error: msg("Enter valid positive numbers for measurements.", "Shigar da lambobi masu inganci don ma'auni.") };
    values[field] = value;
  }
  if (!customerId) return { error: msg("Choose a valid customer.", "Zaɓi kwastoma mai inganci.") };
  if (label.length < 2 || label.length > 100) return { error: msg("Measurement set name must be 2–100 characters.", "Sunan ma'auni ya kasance tsakanin haruffa 2 zuwa 100.") };
  if (!Object.keys(values).length) return { error: msg("Enter at least one measurement.", "Shigar da aƙalla ma'auni guda ɗaya.") };
  if (unit !== "inches" && unit !== "cm") return { error: msg("Choose inches or centimetres.", "Zaɓi inci ko santimita.") };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: msg("Your session has expired. Sign in again.", "Lokacin shiga ya ƙare. Sake shiga asusunka.") };
  const { data: customer, error: customerError } = await supabase.from("customers")
    .select("id, business_id").eq("id", customerId).maybeSingle();
  if (customerError || !customer) return { error: msg("Customer not found in your authorized workspace.", "Ba a sami kwastoman a wurin kasuwancin da aka ba ka izini ba.") };
  const { data: membership } = await supabase.from("business_members").select("business_id")
    .eq("user_id", user.id).eq("business_id", customer.business_id).maybeSingle();
  if (!membership) return { error: msg("You do not have access to this customer.", "Ba ka da izinin ganin wannan kwastoma.") };
  const { error } = await supabase.from("measurements").insert({
    business_id: customer.business_id, customer_id: customer.id, label,
    measurement_values: values, unit, notes: notes || null, created_by: user.id,
  });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return { error: msg("Measurements are not available yet. Apply the database migration first.", "Ba a kunna tsarin ma'auni ba tukuna. A fara aiwatar da migration.") };
    return { error: msg("Measurements could not be saved. Check the entries and try again.", "An kasa ajiye ma'auni. Duba bayanan sannan ka sake gwadawa.") };
  }
  revalidatePath("/workspace");
  return { success: msg("Measurements saved successfully.", "An ajiye ma'auni cikin nasara.") };
}
