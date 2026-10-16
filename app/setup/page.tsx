import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Check, Scissors, ShoppingBasket } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { createBusinessAction } from "@/app/setup/actions";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const setupErrorMessages: Record<string, string> = {
  "invalid-input": "Enter a business name and choose a business type.",
  "not-configured": "Supabase is not configured. Add the environment values and restart the app.",
  "customer-only": "Customer accounts cannot create business workspaces.",
  "session-error": "We could not verify your session. Please sign in again.",
  "database-not-ready": "Workspace database objects are unavailable. Ask an administrator to verify the foundation migration and schema cache.",
  "permission-denied": "Your account is not authorized to create this workspace. Contact an administrator.",
  "save-failed": "We could not save that workspace. Please try again.",
};

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
  if (user.user_metadata?.intent === "customer") {
    return (
      <main className="setup-shell setup-customer">
        <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
        <div className="setup-mark"><Check size={22} /></div>
        <p className="eyebrow">Account created</p>
        <h1>Your customer dashboard is coming soon.</h1>
        <p>Customer registration is ready, but order verification and the multi-shop dashboard are planned for a later milestone. No orders have been linked to this account.</p>
        <form action={signOutAction}><button className="text-button" type="submit">Sign out</button></form>
      </main>
    );
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, business_type")
    .order("created_at", { ascending: true });

  if (businesses?.length) {
    redirect("/workspace");
  }

  return (
    <main className="setup-page">
      <header className="setup-header">
        <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
        <form action={signOutAction}><button className="text-button" type="submit">Sign out</button></form>
      </header>
      <div className="setup-content">
        <p className="eyebrow">A good place to start</p>
        <h1>Tell us about your business.</h1>
        <p className="setup-lead">Your workspace is private to your business. You can invite a team in a later setup step.</p>
        {error ? <p className="notice notice-error" role="alert">{setupErrorMessages[error] ?? setupErrorMessages["save-failed"]}</p> : null}
        <form action={createBusinessAction} className="setup-form">
          <label htmlFor="business-name">Business name</label>
          <input id="business-name" name="name" placeholder="e.g. Amina's Atelier" minLength={2} maxLength={100} required />
          <fieldset>
            <legend>Choose your workspace</legend>
            <div className="type-options">
              <label className="type-option">
                <input type="radio" name="type" value="tailor" defaultChecked required />
                <span className="type-icon"><Scissors size={20} /></span>
                <span className="type-copy"><strong>Tailoring</strong><small>Orders, measurements and production</small></span>
              </label>
              <label className="type-option">
                <input type="radio" name="type" value="trading" required />
                <span className="type-icon"><ShoppingBasket size={20} /></span>
                <span className="type-copy"><strong>Trading & retail</strong><small>Products, stock and sales</small></span>
              </label>
            </div>
          </fieldset>
          <button className="button button-green" type="submit">Create workspace <ArrowRight size={17} /></button>
        </form>
        <p className="setup-note"><BriefcaseBusiness size={15} /> You can create one workspace now. More than one can be managed later.</p>
      </div>
    </main>
  );
}