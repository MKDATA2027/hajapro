import Link from "next/link";
import { signInWithGoogleAction, signOutAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

const roles = [
  { type: "tailor", title: "Tailor", description: "Orders, measurements and production", route: "/tailor" },
  { type: "trading", title: "Retailer", description: "Products, stock and sales", route: "/retailer" },
  { type: "customer", title: "Customer", description: "Customer account and order access", route: "/customer" },
] as const;

export const dynamic = "force-dynamic";
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  let email: string | null = null;
  if (getSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }
  const errors: Record<string, string> = {
    "not-configured": "Google sign-in is not configured yet.",
    "google-sign-in": "Google sign-in could not be completed. Please try again.",
    "workspace-check": "We could not safely identify your existing workspace. Please contact support.",
    "account-setup": "Your Google account was verified, but account setup could not be completed.",
    "invalid-experience": "Choose one of the available experiences.",
    "sign-out": "We could not sign you out. Please try again.",
  };
  return <main className="role-shell">
    <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
    <p className="eyebrow">Account access</p><h1>Choose your experience.</h1>
    <p className="role-lead">Sign in securely with your Google Account. Existing HajaPro accounts with the same verified email can keep their current workspace and data.</p>
    {error ? <p className="notice notice-error" role="alert">{errors[error] ?? "Something went wrong. Please try again."}</p> : null}
    {email ? <div className="signed-in-note">Signed in as <strong>{email}</strong><form action={signOutAction}><button className="text-button" type="submit">Sign out</button></form></div> : null}
    <div className="role-grid">{roles.map(role => <article className="role-card" key={role.type}>
      <h2>{role.title}</h2><p>{role.description}</p>
      <Link className="button button-dark" href={role.route}>Open {role.title} preview</Link>
      <form action={signInWithGoogleAction}>
        <input type="hidden" name="intent" value={role.type} />
        <button className="button button-green" type="submit">Continue with Google</button>
      </form>
    </article>)}</div>
    <p className="auth-legal">Google verifies your identity. HajaPro does not ask you to create or remember a separate password.</p>
    <Link className="back-link" href="/">Back to home</Link>
  </main>;
}
