import Link from "next/link";
import { signInWithGoogleAction, signOutAction } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

const content = {
  tailor: { title: "Tailor workspace", description: "A focused space for tailoring businesses. Public preview only; private orders and measurements require an authenticated account.", type: "tailor" as const },
  trading: { title: "Retailer workspace", description: "A focused space for products, stock and sales. Public preview only; private inventory and sales data require an authenticated account.", type: "trading" as const },
  customer: { title: "Customer space", description: "Customer experience preview. Order tracking and linked shop orders are not available yet; no private order information is displayed.", type: "customer" as const },
};

export async function PublicExperience({ role }: { role: keyof typeof content }) {
  const item = content[role];
  let email: string | null = null;
  if (getSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }
  return <main className="experience-shell">
    <header className="experience-header"><Link className="wordmark" href="/">HAJA<span>PRO</span></Link><Link className="back-link" href="/settings">Settings</Link></header>
    <section className="experience-content">
      <p className="eyebrow">Google Account access</p>
      <h1>{item.title}</h1><p>{item.description}</p>
      <div className="experience-actions">
        {email ? <><p className="signed-in-note">Signed in as {email}</p><form action={signOutAction}><button className="button button-dark" type="submit">Sign out</button></form></> : <form action={signInWithGoogleAction}><input type="hidden" name="intent" value={item.type} /><button className="button button-green" type="submit">Continue with Google</button></form>}
      </div>
      <Link className="role-auth-link" href="/settings">Switch experience in Settings</Link>
    </section>
  </main>;
}
