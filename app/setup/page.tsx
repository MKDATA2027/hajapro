import Link from "next/link";
import { redirect } from "next/navigation";
import { createBusinessAction } from "@/app/setup/actions";
import { signOutAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string; type?: string }> }) {
  if (!getSupabaseConfig()) return <main className="setup-shell"><h1>Account service unavailable</h1><p>Supabase is not configured.</p><Link className="button button-dark" href="/">Return home</Link></main>;
  const params = await searchParams;
  const intent = params.type === "trading" ? "trading" : "tailor";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?type=${intent}`);
  if (user.user_metadata?.intent === "customer") redirect("/customer");
  if (user.user_metadata?.intent && user.user_metadata.intent !== intent) redirect(user.user_metadata.intent === "trading" ? "/retailer" : "/tailor");
  const { data: businesses, error } = await supabase.from("businesses").select("id, business_type").eq("business_type", intent).limit(1);
  if (error) return <main className="setup-shell"><h1>Workspace check failed</h1><p>We could not verify your business workspace. Please try again later.</p><form action={signOutAction}><button className="text-button">Sign out</button></form></main>;
  if (businesses?.length) redirect(intent === "trading" ? "/retailer" : "/tailor");
  return <main className="setup-page">
    <header className="setup-header"><Link className="wordmark" href="/">HAJA<span>PRO</span></Link><form action={signOutAction}><button className="text-button">Sign out</button></form></header>
    <div className="setup-content"><p className="eyebrow">{intent === "trading" ? "Retailer" : "Tailor"} setup</p><h1>Set up your workspace.</h1>
      <p className="setup-lead">This creates a private {intent === "trading" ? "Retailer" : "Tailor"} workspace for your account.</p>
      {params.error ? <p className="notice notice-error" role="alert">{params.error === "role-mismatch" ? "The selected workspace does not match this account." : "We could not save your workspace. Please try again."}</p> : null}
      <form action={createBusinessAction} className="setup-form">
        <input type="hidden" name="type" value={intent} />
        <label htmlFor="business-name">Business name</label><input id="business-name" name="name" placeholder={intent === "trading" ? "e.g. Amina Stores" : "e.g. Amina's Atelier"} minLength={2} maxLength={100} required />
        <button className="button button-green" type="submit">Create {intent === "trading" ? "Retailer" : "Tailor"} workspace</button>
      </form>
    </div>
  </main>;
}