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

function credentialsFrom(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signInAction(formData: FormData) {
  if (!getSupabaseConfig()) redirect("/sign-in?error=not-configured");
  const credentials = credentialsFrom(formData);
  if (!credentials.success) redirect("/sign-in?error=invalid-input");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);
  if (error) redirect("/sign-in?error=authentication");
  redirect("/setup");
}

export async function signUpAction(formData: FormData) {
  if (!getSupabaseConfig()) redirect("/sign-up?error=not-configured");
  const credentials = credentialsFrom(formData);
  if (!credentials.success) redirect("/sign-up?error=invalid-input");
  const intent = intentSchema.safeParse(formData.get("intent"));
  if (!intent.success) redirect("/sign-up?error=invalid-input");
  const appUrl = getAppUrl();
  if (!appUrl) redirect("/sign-up?error=not-configured");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials.data,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: { intent: intent.data },
    },
  });

  if (error) redirect("/sign-up?error=registration");
  if (!data.session) redirect("/sign-up?sent=1");
  redirect("/setup");
}

export async function signOutAction() {
  if (getSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) redirect("/sign-in?error=sign-out");
  }
  redirect("/");
}