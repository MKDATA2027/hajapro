"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getSupabaseConfig } from "@/lib/supabase/config";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});
const intentSchema = z.enum(["tailor", "trading", "customer"]);
type Intent = z.infer<typeof intentSchema>;

function routeFor(intent: Intent) {
  return intent === "trading" ? "/retailer" : `/${intent}`;
}

function credentialsFrom(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signInAction(formData: FormData) {
  const intent = intentSchema.safeParse(formData.get("intent"));
  if (!intent.success) redirect("/sign-in?error=invalid-input");
  if (!getSupabaseConfig()) redirect(`/sign-in?type=${intent.data}&error=not-configured`);
  const credentials = credentialsFrom(formData);
  if (!credentials.success) redirect(`/sign-in?type=${intent.data}&error=invalid-input`);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) redirect(`/sign-in?type=${intent.data}&error=authentication`);

  if (intent.data !== "customer") {
    const businessType = intent.data === "trading" ? "trading" : "tailor";
    const { data: businesses, error: lookupError } = await supabase
      .from("businesses")
      .select("id")
      .eq("business_type", businessType)
      .limit(1);
    if (lookupError) redirect(`/sign-in?type=${intent.data}&error=workspace`);
    if (!businesses?.length) redirect(`/setup?type=${intent.data}`);
  }
  redirect(routeFor(intent.data));
}

export async function signUpAction(formData: FormData) {
  const intent = intentSchema.safeParse(formData.get("intent"));
  if (!intent.success) redirect("/sign-up?error=invalid-input");
  if (!getSupabaseConfig()) redirect(`/sign-up?type=${intent.data}&error=not-configured`);
  const credentials = credentialsFrom(formData);
  if (!credentials.success) redirect(`/sign-up?type=${intent.data}&error=invalid-input`);
  if (!getAppUrl()) redirect(`/sign-up?type=${intent.data}&error=not-configured`);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials.data,
    options: { data: { intent: intent.data } },
  });
  if (error) redirect(`/sign-up?type=${intent.data}&error=registration`);
  if (data.session) redirect(routeFor(intent.data));
  redirect(`/verify-email?email=${encodeURIComponent(credentials.data.email)}&type=${intent.data}`);
}

export async function verifyEmailOtpAction(formData: FormData) {
  const email = z.email().safeParse(formData.get("email"));
  const token = z.string().trim().regex(/^\\d{6}$/).safeParse(formData.get("token"));
  const intent = intentSchema.safeParse(formData.get("intent"));
  if (!email.success || !token.success || !intent.success) {
    redirect("/verify-email?error=invalid-input");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email: email.data,
    token: token.data,
    type: "email",
  });
  if (error) redirect(`/verify-email?email=${encodeURIComponent(email.data)}&type=${intent.data}&error=invalid-code`);
  redirect(routeFor(intent.data));
}

export async function signOutAction() {
  if (getSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) redirect("/settings?error=sign-out");
  }
  redirect("/");
}
