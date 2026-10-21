"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ModuleActionState = { error?: string; success?: string };
const textValue = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const moneyValue = (form: FormData, key: string) => {
  const raw = textValue(form, key);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000_000 ? n : null;
};

async function authorizedBusiness(businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: "Zaman shiga ya ƙare. Ka sake shiga.", supabase: null, user: null };
  const { data: membership } = await supabase.from("business_members").select("business_id, role")
    .eq("user_id", user.id).eq("business_id", businessId).maybeSingle();
  if (!membership) return { error: "Ba ka da izinin wannan kasuwancin.", supabase: null, user: null };
  return { error: null, supabase, user, membership };
}

export async function createOrderAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id");
  const title = textValue(form, "title");
  const customerId = textValue(form, "customer_id") || null;
  const description = textValue(form, "description");
  const status = textValue(form, "status") || "new";
  const total = moneyValue(form, "total_amount");
  const deposit = moneyValue(form, "deposit_amount");
  const dueDate = textValue(form, "due_date") || null;
  if (!businessId || title.length < 2 || title.length > 160) return { error: "Shigar da sunan oda mai inganci." };
  if (total === null || deposit === null || deposit > total) return { error: "Duba jimillar kuɗi da deposit." };
  const allowed = ["new","measuring","cutting","sewing","fitting","ready","completed","cancelled"];
  if (!allowed.includes(status)) return { error: "Matakin oda bai inganta ba." };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  if (customerId) {
    const { data } = await ctx.supabase.from("customers").select("id").eq("id", customerId).eq("business_id", businessId).maybeSingle();
    if (!data) return { error: "Zaɓi kwastoma daga wannan kasuwancin." };
  }
  const { error } = await ctx.supabase.from("orders").insert({
    business_id: businessId, customer_id: customerId, title, description: description || null,
    status, total_amount: total, deposit_amount: deposit, due_date: dueDate, created_by: ctx.user.id,
  });
  if (error) return { error: error.code === "42P01" ? "Ba a kunna order database migration ba tukuna." : "Ba a iya ajiye odar ba. Duba bayanan ka." };
  revalidatePath("/workspace");
  return { success: "An ajiye oda cikin nasara." };
}

export async function createProductAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), name = textValue(form, "name");
  const sku = textValue(form, "sku"), category = textValue(form, "category");
  const price = moneyValue(form, "unit_price"), stock = moneyValue(form, "stock_quantity");
  const threshold = moneyValue(form, "low_stock_threshold");
  if (!businessId || name.length < 2 || name.length > 120) return { error: "Shigar da sunan kaya mai inganci." };
  if (price === null || stock === null || threshold === null) return { error: "Farashi da stock dole su zama lambobi masu inganci." };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  const { data, error } = await ctx.supabase.from("products").insert({
    business_id: businessId, name, sku: sku || null, category: category || null,
    unit_price: price, stock_quantity: stock, low_stock_threshold: threshold, created_by: ctx.user.id,
  }).select("id").maybeSingle();
  if (error || !data) return { error: error?.code === "23505" ? "SKU ɗin nan ya riga ya kasance." : "Ba a iya ajiye kaya ba. Tabbatar an yi database migration." };
  if (stock > 0) {
    const { error: movementError } = await ctx.supabase.from("inventory_movements").insert({
      business_id: businessId, product_id: data.id, movement_type: "stock_in",
      quantity: stock, note: "Opening stock", created_by: ctx.user.id,
    });
    if (movementError) return { error: "An ƙirƙiri kaya amma an kasa rubuta tarihin stock. Tuntuɓi mai kula da tsarin." };
  }
  revalidatePath("/workspace");
  return { success: "An ajiye kaya cikin nasara." };
}

export async function recordStockMovementAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), productId = textValue(form, "product_id");
  const movement = textValue(form, "movement_type"), quantity = moneyValue(form, "quantity");
  const note = textValue(form, "note");
  if (!businessId || !productId || !["stock_in","stock_out","adjustment"].includes(movement) || quantity === null || quantity <= 0) return { error: "Duba nau'in motsin kaya da adadi." };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  const { data: product } = await ctx.supabase.from("products").select("id,stock_quantity").eq("id", productId).eq("business_id", businessId).maybeSingle();
  if (!product) return { error: "Ba a sami wannan kaya ba." };
  const current = Number(product.stock_quantity);
  const next = movement === "stock_in" ? current + quantity : movement === "stock_out" ? current - quantity : quantity;
  if (next < 0) return { error: "Ba za a cire kaya fiye da wanda yake stock ba." };
  const movementQuantity = movement === "adjustment" ? Math.abs(next - current) : quantity;
  if (movementQuantity <= 0) return { error: "Adadin stock bai canza ba." };
  const { error: updateError } = await ctx.supabase.from("products").update({ stock_quantity: next, updated_at: new Date().toISOString() }).eq("id", productId).eq("business_id", businessId);
  if (updateError) return { error: "Ba a iya sabunta stock ba." };
  const { error } = await ctx.supabase.from("inventory_movements").insert({
    business_id: businessId, product_id: productId, movement_type: movement,
    quantity: movementQuantity, note: note || null, created_by: ctx.user.id,
  });
  if (error) return { error: "Stock ya canza amma an kasa rubuta movement history. A bincika bayanan." };
  revalidatePath("/workspace");
  return { success: "An sabunta stock cikin nasara." };
}

export async function recordPaymentAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), orderId = textValue(form, "order_id");
  const amount = moneyValue(form, "amount"), method = textValue(form, "payment_method") || "cash";
  const reference = textValue(form, "reference"), note = textValue(form, "note");
  if (!businessId || !orderId || amount === null || amount <= 0) return { error: "Zaɓi oda kuma shigar da kuɗin da aka karɓa." };
  if (!["cash","bank_transfer","pos","other"].includes(method)) return { error: "Hanyar biyan kuɗi ba ta inganta ba." };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  const { data: order } = await ctx.supabase.from("orders").select("id,total_amount,deposit_amount").eq("id", orderId).eq("business_id", businessId).maybeSingle();
  if (!order) return { error: "Ba a sami odar ba." };
  const { data: paidRows } = await ctx.supabase.from("order_payments").select("amount,status").eq("order_id", orderId).eq("business_id", businessId).neq("status","rejected");
  const recordedPayments = (paidRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  if (recordedPayments + amount > Number(order.total_amount)) return { error: "Jimillar biyan kuɗi da ke jiran dubawa ko waɗanda aka tabbatar za su wuce kuɗin odar." };
  const { error } = await ctx.supabase.from("order_payments").insert({
    business_id: businessId, order_id: orderId, amount, payment_method: method,
    reference: reference || null, note: note || null, recorded_by: ctx.user.id, status: "pending",
  });
  if (error) return { error: "Ba a iya rubuta biyan kuɗin ba. Tabbatar an kunna migration." };
  revalidatePath("/workspace");
  return { success: "An rubuta biyan kuɗin; yana jiran tabbatarwar mai izini." };
}

export async function updateOrderStatusAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), orderId = textValue(form, "order_id");
  const status = textValue(form, "status");
  const allowed = ["new","measuring","cutting","sewing","fitting","ready","completed","cancelled"];
  if (!businessId || !orderId || !allowed.includes(status)) return { error: "Duba matakin odar." };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  const { error } = await ctx.supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId).eq("business_id", businessId);
  if (error) return { error: "Ba a iya sabunta matakin oda ba." };
  revalidatePath("/workspace");
  return { success: "An sabunta matakin oda." };
}

export async function reviewPaymentAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), paymentId = textValue(form, "payment_id");
  const decision = textValue(form, "decision");
  if (!businessId || !paymentId || !["verified","rejected"].includes(decision)) return { error: "Bayanin tabbatar da biyan kuɗi bai inganta ba." };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  if (!ctx.membership || !["owner","manager"].includes(ctx.membership.role)) return { error: "Mai kasuwanci ko manager kaɗai zai iya tantance biyan kuɗi." };
  const { data: payment } = await ctx.supabase.from("order_payments").select("id,status").eq("id", paymentId).eq("business_id", businessId).maybeSingle();
  if (!payment || payment.status !== "pending") return { error: "Ba a sami payment mai jiran tantancewa ba." };
  const { error } = await ctx.supabase.from("order_payments").update({
    status: decision, verified_by: ctx.user.id, verified_at: new Date().toISOString(),
  }).eq("id", paymentId).eq("business_id", businessId).eq("status","pending");
  if (error) return { error: "Ba a iya sabunta matsayin payment ba." };
  revalidatePath("/workspace");
  return { success: decision === "verified" ? "An tabbatar da biyan kuɗi." : "An ƙi biyan kuɗin." };
}

export async function markNotificationReadAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const notificationId = textValue(form, "notification_id");
  if (!notificationId) return { error: "Sanarwar ba ta inganta ba." };
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Zaman shiga ya ƙare. Ka sake shiga." };
  const { error } = await supabase.from("app_notifications").update({ read_at: new Date().toISOString() })
    .eq("id", notificationId).eq("user_id", user.id).is("read_at", null);
  if (error) return { error: "Ba a iya sabunta sanarwar ba." };
  revalidatePath("/workspace");
  return { success: "An karanta sanarwar." };
}
