"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getSupabaseConfig } from "@/lib/supabase/config";

const intentSchema = z.enum(["tailor", "trading", "customer"]);

export async function signInWithGoogleAction(formData: FormData) {
  const parsed = intentSchema.safeParse(formData.get("intent"));
  if (!parsed.success) redirect("/settings?error=invalid-experience");
  const appUrl = getAppUrl();
  if (!appUrl || !getSupabaseConfig()) redirect("/settings?error=not-configured");
  const supabase = await createSupabaseServerClient();
  const callback = new URL("/auth/callback", appUrl);
  callback.searchParams.set("type", parsed.data);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString(), queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) redirect("/settings?error=google-sign-in");
  redirect(data.url);
}

export async function signOutAction() {
  if (getSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) redirect("/settings?error=sign-out");
  }
  redirect("/");
}
