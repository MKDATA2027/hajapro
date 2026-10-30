import Link from "next/link";
import { ArrowRight, Scissors, ShoppingBasket, UserRound, ShieldCheck } from "lucide-react";
import { signInWithGoogleAction, selectExperienceAction, signOutAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { redirect } from "next/navigation";

const roles = [
  { type: "tailor", title: "Tailor", description: "Orders, measurements and production", detail: "For tailoring businesses", Icon: Scissors },
  { type: "trading", title: "Retailer", description: "Products, stock and sales", detail: "For shops and retail businesses", Icon: ShoppingBasket },
  { type: "customer", title: "Customer", description: "Customer account and order access", detail: "Follow your orders and shop updates", Icon: UserRound },
] as const;
type Experience = (typeof roles)[number]["type"];
const isExperience = (value: string | undefined): value is Experience =>
  value === "tailor" || value === "trading" || value === "customer";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; experience?: string }> }) {
  const { error, experience } = await searchParams;
  const selected = isExperience(experience) ? experience : null;
  let email: string | null = null;
  let signedIn = false;
  if (getSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
    signedIn = Boolean(user);
    if (user && selected) {
      const { error: updateError } = await supabase.auth.updateUser({ data: { intent: selected } });
      if (!updateError) {
        if (selected === "customer") redirect("/customer");
        redirect(`/setup?type=${selected}`);
      }
    }
  }
  const errors: Record<string, string> = {
    "not-configured": "Google sign-in is not configured yet.",
    "google-sign-in": "Google sign-in could not be completed. Please try again.",
    "workspace-check": "We could not safely identify your existing workspace.",
    "account-setup": "Your Google account was verified, but account setup could not be completed.",
    "invalid-experience": "Choose one of the available experiences.",
    "sign-out": "We could not sign you out. Please try again.",
    "session-error": "Your session could not be verified. Please sign in again.",
  };
  const visibleRoles = selected ? roles.filter(role => role.type === selected) : roles;
  return (
    <main className="role-shell">
      <header className="role-header">
        <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
        <span className="role-secure"><ShieldCheck size={16} /> Secure account access</span>
      </header>
      <section className="role-content">
        <div className="role-intro">
          <p className="eyebrow">ACCOUNT ACCESS</p>
          <h1>{selected ? `Continue as ${roles.find(role => role.type === selected)?.title}` : "Choose your experience."}</h1>
          <p className="role-lead">{selected ? "Your choice is saved through sign-in. You will continue directly to this HajaPro experience." : "Choose the HajaPro space that matches what you need. Your choice determines which experience opens next."}</p>
        </div>
        {error ? <p className="notice notice-error" role="alert">{errors[error] ?? "Something went wrong. Please try again."}</p> : null}
        {email ? <div className="role-session"><span className="role-session-label">SIGNED IN</span><strong>{email}</strong><form action={signOutAction}><button className="text-button" type="submit">Sign out</button></form></div> : null}
        <div className="role-grid">
          {visibleRoles.map(({ type, title, description, detail, Icon }) => (
            <article className={`role-card${selected === type ? " is-selected" : ""}`} key={type}>
              <span className="role-card-icon"><Icon size={23} strokeWidth={1.8} /></span>
              <span className="role-card-detail">{detail}</span><h2>{title}</h2><p>{description}</p>
              <form action={signedIn ? selectExperienceAction : signInWithGoogleAction}>
                <input type="hidden" name="intent" value={type} />
                <button className="button button-green role-continue" type="submit">{signedIn ? `Open ${title} experience` : "Continue with Google"}<ArrowRight size={17} /></button>
              </form>
            </article>
          ))}
        </div>
        <p className="auth-legal">Google verifies your identity. HajaPro does not ask you to create or remember a separate password.</p>
        <Link className="back-link" href="/">Back to home</Link>
      </section>
    </main>
  );
}
