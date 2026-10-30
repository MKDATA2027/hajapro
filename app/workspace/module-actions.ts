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

const message = (form: FormData, ha: string, en: string) => textValue(form, "language") === "en" ? en : ha;

async function authorizedBusiness(businessId: string, form: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: message(form, "Zaman shiga ya ƙare. Ka sake shiga.", "Your session expired. Please sign in again."), supabase: null, user: null };
  const { data: membership } = await supabase.from("business_members").select("business_id, role")
    .eq("user_id", user.id).eq("business_id", businessId).maybeSingle();
  if (!membership) return { error: message(form, "Ba ka da izinin wannan kasuwancin.", "You do not have access to this business."), supabase: null, user: null };
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
  if (!businessId || title.length < 2 || title.length > 160) return { error: message(form, "Shigar da sunan oda mai inganci.", "Enter a valid order title.") };
  if (total === null || deposit === null || deposit > total) return { error: message(form, "Duba jimillar kuɗi da deposit.", "Check the total and deposit amounts.") };
  const allowed = ["new","measuring","cutting","sewing","fitting","ready","completed","cancelled"];
  if (!allowed.includes(status)) return { error: message(form, "Matakin oda bai inganta ba.", "The order status is invalid.") };
  const ctx = await authorizedBusiness(businessId, form);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  if (customerId) {
    const { data } = await ctx.supabase.from("customers").select("id").eq("id", customerId).eq("business_id", businessId).maybeSingle();
    if (!data) return { error: message(form, "Zaɓi kwastoma daga wannan kasuwancin.", "Choose a customer from this business.") };
  }
  const { error } = await ctx.supabase.from("orders").insert({
    business_id: businessId, customer_id: customerId, title, description: description || null,
    status, total_amount: total, deposit_amount: deposit, due_date: dueDate, created_by: ctx.user.id,
  });
  if (error) return { error: error.code === "42P01" ? "Ba a kunna order database migration ba tukuna." : "Ba a iya ajiye odar ba. Duba bayanan ka." };
  revalidatePath("/workspace");
  return { success: message(form, "An ajiye oda cikin nasara.", "Order saved successfully.") };
}

export async function createProductAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), name = textValue(form, "name");
  const sku = textValue(form, "sku"), category = textValue(form, "category");
  const price = moneyValue(form, "unit_price"), stock = moneyValue(form, "stock_quantity");
  const threshold = moneyValue(form, "low_stock_threshold");
  if (!businessId || name.length < 2 || name.length > 120) return { error: message(form, "Shigar da sunan kaya mai inganci.", "Enter a valid product name.") };
  if (price === null || stock === null || threshold === null) return { error: message(form, "Farashi da stock dole su zama lambobi masu inganci.", "Price and stock must be valid numbers.") };
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
    if (movementError) return { error: message(form, "An ƙirƙiri kaya amma an kasa rubuta tarihin stock. Tuntuɓi mai kula da tsarin.", "The product was created, but its stock history could not be recorded. Contact the system administrator.") };
  }
  revalidatePath("/workspace");
  return { success: message(form, "An ajiye kaya cikin nasara.", "Product saved successfully.") };
}

export async function recordStockMovementAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), productId = textValue(form, "product_id");
  const movement = textValue(form, "movement_type"), quantity = moneyValue(form, "quantity");
  const note = textValue(form, "note");
  if (!businessId || !productId || !["stock_in","stock_out","adjustment"].includes(movement) || quantity === null || quantity <= 0) return { error: message(form, "Duba nau'in motsin kaya da adadi.", "Check the stock movement type and quantity.") };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  const { data: product } = await ctx.supabase.from("products").select("id,stock_quantity").eq("id", productId).eq("business_id", businessId).maybeSingle();
  if (!product) return { error: message(form, "Ba a sami wannan kaya ba.", "This product was not found.") };
  const current = Number(product.stock_quantity);
  const next = movement === "stock_in" ? current + quantity : movement === "stock_out" ? current - quantity : quantity;
  if (next < 0) return { error: message(form, "Ba za a cire kaya fiye da wanda yake stock ba.", "You cannot remove more stock than is available.") };
  const movementQuantity = movement === "adjustment" ? Math.abs(next - current) : quantity;
  if (movementQuantity <= 0) return { error: message(form, "Adadin stock bai canza ba.", "The stock quantity has not changed.") };
  const { error: updateError } = await ctx.supabase.from("products").update({ stock_quantity: next, updated_at: new Date().toISOString() }).eq("id", productId).eq("business_id", businessId);
  if (updateError) return { error: message(form, "Ba a iya sabunta stock ba.", "Could not update stock.") };
  const { error } = await ctx.supabase.from("inventory_movements").insert({
    business_id: businessId, product_id: productId, movement_type: movement,
    quantity: movementQuantity, note: note || null, created_by: ctx.user.id,
  });
  if (error) return { error: message(form, "Stock ya canza amma an kasa rubuta movement history. A bincika bayanan.", "Stock changed, but the movement history could not be recorded. Review the records.") };
  revalidatePath("/workspace");
  return { success: message(form, "An sabunta stock cikin nasara.", "Stock updated successfully.") };
}

export async function recordPaymentAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), orderId = textValue(form, "order_id");
  const amount = moneyValue(form, "amount"), method = textValue(form, "payment_method") || "cash";
  const reference = textValue(form, "reference"), note = textValue(form, "note");
  if (!businessId || !orderId || amount === null || amount <= 0) return { error: message(form, "Zaɓi oda kuma shigar da kuɗin da aka karɓa.", "Select an order and enter the amount received.") };
  if (!["cash","bank_transfer","pos","other"].includes(method)) return { error: message(form, "Hanyar biyan kuɗi ba ta inganta ba.", "The payment method is invalid.") };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  const { data: order } = await ctx.supabase.from("orders").select("id,total_amount,deposit_amount").eq("id", orderId).eq("business_id", businessId).maybeSingle();
  if (!order) return { error: message(form, "Ba a sami odar ba.", "Order not found.") };
  const { data: paidRows } = await ctx.supabase.from("order_payments").select("amount,status").eq("order_id", orderId).eq("business_id", businessId).neq("status","rejected");
  const recordedPayments = (paidRows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  if (recordedPayments + amount > Number(order.total_amount)) return { error: message(form, "Jimillar biyan kuɗi da ke jiran dubawa ko waɗanda aka tabbatar za su wuce kuɗin odar.", "Pending and verified payments would exceed the order total.") };
  const { error } = await ctx.supabase.from("order_payments").insert({
    business_id: businessId, order_id: orderId, amount, payment_method: method,
    reference: reference || null, note: note || null, recorded_by: ctx.user.id, status: "pending",
  });
  if (error) return { error: message(form, "Ba a iya rubuta biyan kuɗin ba. Tabbatar an kunna migration.", "Could not record the payment. Verify that the migration is enabled.") };
  revalidatePath("/workspace");
  return { success: message(form, "An rubuta biyan kuɗin; yana jiran tabbatarwar mai izini.", "Payment recorded and awaiting authorized review.") };
}

export async function updateOrderStatusAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), orderId = textValue(form, "order_id");
  const status = textValue(form, "status");
  const allowed = ["new","measuring","cutting","sewing","fitting","ready","completed","cancelled"];
  if (!businessId || !orderId || !allowed.includes(status)) return { error: message(form, "Duba matakin odar.", "Check the order status.") };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  const { error } = await ctx.supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId).eq("business_id", businessId);
  if (error) return { error: message(form, "Ba a iya sabunta matakin oda ba.", "Could not update the order status.") };
  revalidatePath("/workspace");
  return { success: message(form, "An sabunta matakin oda.", "Order status updated.") };
}

export async function reviewPaymentAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const businessId = textValue(form, "business_id"), paymentId = textValue(form, "payment_id");
  const decision = textValue(form, "decision");
  if (!businessId || !paymentId || !["verified","rejected"].includes(decision)) return { error: message(form, "Bayanin tabbatar da biyan kuɗi bai inganta ba.", "The payment review details are invalid.") };
  const ctx = await authorizedBusiness(businessId);
  if (ctx.error || !ctx.supabase || !ctx.user) return { error: ctx.error ?? "An kasa tabbatar da izini." };
  if (!ctx.membership || !["owner","manager"].includes(ctx.membership.role)) return { error: message(form, "Mai kasuwanci ko manager kaɗai zai iya tantance biyan kuɗi.", "Only an owner or manager can review payments.") };
  const { data: payment } = await ctx.supabase.from("order_payments").select("id,status").eq("id", paymentId).eq("business_id", businessId).maybeSingle();
  if (!payment || payment.status !== "pending") return { error: message(form, "Ba a sami payment mai jiran tantancewa ba.", "No pending payment was found.") };
  const { error } = await ctx.supabase.from("order_payments").update({
    status: decision, verified_by: ctx.user.id, verified_at: new Date().toISOString(),
  }).eq("id", paymentId).eq("business_id", businessId).eq("status","pending");
  if (error) return { error: message(form, "Ba a iya sabunta matsayin payment ba.", "Could not update the payment status.") };
  revalidatePath("/workspace");
  return { success: decision === "verified" ? message(form, "An tabbatar da biyan kuɗi.", "Payment approved.") : message(form, "An ƙi biyan kuɗin.", "Payment rejected.") };
}

export async function markNotificationReadAction(_prev: ModuleActionState, form: FormData): Promise<ModuleActionState> {
  const notificationId = textValue(form, "notification_id");
  if (!notificationId) return { error: message(form, "Sanarwar ba ta inganta ba.", "The notification is invalid.") };
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Zaman shiga ya ƙare. Ka sake shiga." };
  const { error } = await supabase.from("app_notifications").update({ read_at: new Date().toISOString() })
    .eq("id", notificationId).eq("user_id", user.id).is("read_at", null);
  if (error) return { error: message(form, "Ba a iya sabunta sanarwar ba.", "Could not update the notification.") };
  revalidatePath("/workspace");
  return { success: message(form, "An karanta sanarwar.", "Notification marked as read.") };
}
