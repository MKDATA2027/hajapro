import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Check } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { createBusinessAction } from "@/app/setup/actions";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const setupErrorMessages: Record<string, string> = {
  "invalid-input": "Enter a valid business name.",
  "not-configured": "Supabase is not configured. Add the environment values and restart the app.",
  "customer-only": "Customer accounts do not create business workspaces.",
  "session-error": "We could not verify your session. Please sign in again.",
  "database-not-ready": "Workspace database objects are unavailable. Ask an administrator to verify the database schema.",
  "permission-denied": "Your account is not authorized to create this workspace. Contact an administrator.",
  "save-failed": "We could not save that workspace. Please try again.",
  "workspace-check": "We could not verify your existing workspace. Please try again.",
  "experience-mismatch": "The selected workspace does not match your saved experience.",
  "workspace-type-conflict": "This account already belongs to a different business experience. Contact support before changing its workspace type.",
};

type BusinessExperience = "tailor" | "trading";
const isBusinessExperience = (value: unknown): value is BusinessExperience =>
  value === "tailor" || value === "trading";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; type?: string }>;
}) {
  if (!getSupabaseConfig()) {
    return (
      <main className="setup-shell">
        <p className="eyebrow">Workspace setup</p>
        <h1>Connect your account service</h1>
        <p>Supabase is not configured yet. Add the environment values in <code>.env.local</code>, then restart the app.</p>
        <Link className="button button-dark" href="/">Return home</Link>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await searchParams;
  const intent = user.user_metadata?.intent;
  if (intent === "customer") redirect("/customer");
  if (!isBusinessExperience(intent)) redirect("/settings");

  const { data: businesses, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, business_type")
    .limit(10);

  if (businessError) {
    return (
      <main className="setup-shell">
        <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
        <p className="notice notice-error" role="alert">{setupErrorMessages["workspace-check"]}</p>
        <form action={signOutAction}><button className="text-button" type="submit">Sign out</button></form>
      </main>
    );
  }

  if (businesses?.some(business => business.business_type === intent)) redirect(intent === "trading" ? "/retailer" : "/tailor");
  if (businesses?.length) {
    return (
      <main className="setup-shell">
        <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
        <p className="eyebrow">Workspace access</p>
        <h1>This account already has a workspace.</h1>
        <p>{setupErrorMessages["workspace-type-conflict"]}</p>
        <form action={signOutAction}><button className="text-button" type="submit">Sign out</button></form>
      </main>
    );
  }

  const experienceName = intent === "tailor" ? "Tailoring" : "Trading & retail";

  return (
    <main className="setup-page">
      <header className="setup-header">
        <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
        <form action={signOutAction}><button className="text-button" type="submit">Sign out</button></form>
      </header>
      <div className="setup-content">
        <div className="setup-mark"><Check size={22} /></div>
        <p className="eyebrow">A good place to start</p>
        <h1>Tell us about your business.</h1>
        <p className="setup-lead">Your {experienceName} workspace is private to your business. You can invite a team in a later setup step.</p>
        {error ? <p className="notice notice-error" role="alert">{setupErrorMessages[error] ?? setupErrorMessages["save-failed"]}</p> : null}
        <form action={createBusinessAction} className="setup-form">
          <label htmlFor="business-name">Business name</label>
          <input id="business-name" name="name" placeholder={intent === "tailor" ? "e.g. Amina's Atelier" : "e.g. Amina's Store"} minLength={2} maxLength={100} required />
          <input type="hidden" name="type" value={intent} />
          <div className="setup-selected-experience">
            <span className="setup-selected-icon"><BriefcaseBusiness size={19} /></span>
            <span><strong>{experienceName}</strong><small>Your selected workspace</small></span>
            <Check size={18} />
          </div>
          <button className="button button-green" type="submit">Create workspace <ArrowRight size={17} /></button>
        </form>
        <p className="setup-note"><BriefcaseBusiness size={15} /> Your selected experience is saved to your account. You will not need to choose it again.</p>
      </div>
    </main>
  );
}
