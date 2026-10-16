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
  if (user.user_metadata?.intent === "customer") redirect("/setup?error=customer-only");

  const { error } = await supabase.rpc("create_business", {
    p_name: parsed.data.name,
    p_type: parsed.data.type,
  });
  if (error) {
    const diagnostic = safeSupabaseDiagnostic(error, [parsed.data.name]);
    console.error("[workspace-setup] create_business RPC failed", diagnostic);
    redirect(`/setup?error=${classifyWorkspaceSaveError(error.code)}`);
  }
  redirect("/workspace");
}