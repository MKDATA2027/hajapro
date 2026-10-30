"use server";

import { redirect } from "next/navigation";
import { businessSetupSchema } from "@/lib/business-setup";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { classifyWorkspaceSaveError, safeSupabaseDiagnostic } from "@/lib/supabase/diagnostics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createBusinessAction(formData: FormData) {
  if (!getSupabaseConfig()) redirect("/setup?error=not-configured");
  const parsed = businessSetupSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) redirect("/setup?error=invalid-input");

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[workspace-setup] auth lookup failed", safeSupabaseDiagnostic(authError));
    redirect("/setup?error=session-error");
  }
  if (!user) redirect("/sign-in");
  const intent = user.user_metadata?.intent;
  if (intent === "customer") redirect("/customer");
  if (intent !== "tailor" && intent !== "trading") redirect("/settings?error=invalid-experience");
  if (parsed.data.type !== intent) redirect(`/setup?type=${intent}&error=experience-mismatch`);

  const { data: businesses, error: lookupError } = await supabase
    .from("businesses")
    .select("id, business_type")
    .limit(10);
  if (lookupError) {
    console.error("[workspace-setup] workspace lookup failed", safeSupabaseDiagnostic(lookupError));
    redirect("/setup?error=workspace-check");
  }
  if (businesses?.some(row => row.business_type === intent)) redirect("/workspace");
  if (businesses?.length) redirect(`/setup?type=${intent}&error=workspace-type-conflict`);

  const { error } = await supabase.rpc("create_business", {
    p_name: parsed.data.name,
    p_type: intent,
  });
  if (error) {
    const diagnostic = safeSupabaseDiagnostic(error, [parsed.data.name]);
    console.error("[workspace-setup] create_business RPC failed", diagnostic);
    redirect(`/setup?type=${intent}&error=${classifyWorkspaceSaveError(error.code)}`);
  }
  redirect("/workspace");
}
