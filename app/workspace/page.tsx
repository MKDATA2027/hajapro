import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, LogOut } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  if (!getSupabaseConfig()) redirect("/sign-in");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  if (user.user_metadata?.intent === "customer") redirect("/setup");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, business_type")
    .order("created_at", { ascending: true });
  if (!businesses?.length) redirect("/setup");

  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <Link className="workspace-logo-link" href="/" aria-label="HAJAPRO home"><img className="workspace-logo-image" src="/branding/hajapro-master-logo.jpg" alt="HAJAPRO — Product of MK Company" /></Link>
        <form action={signOutAction}>
          <button className="icon-text-button" type="submit"><LogOut size={16} /> Sign out</button>
        </form>
      </header>
      <section className="workspace-content">
        <p className="eyebrow">Your HajaPro workspace</p>
        <h1>Welcome to a smarter way to work.</h1>
        <p className="workspace-lead">Your account is connected. Business operations are being built in the next milestones.</p>
        <div className="workspace-list">
          {businesses.map((business) => (
            <article className="workspace-item" key={business.id}>
              <div className="workspace-item-icon"><BriefcaseBusiness size={20} /></div>
              <div><h2>{business.name}</h2><p>{business.business_type === "tailor" ? "Tailoring workspace" : "Trading & retail workspace"}</p></div>
              <span className="workspace-status">Setup complete</span>
            </article>
          ))}
        </div>
        <div className="planned-strip">
          <span>Next up</span>
          <p>Customer and order management for your workspace</p>
          <ArrowRight size={18} />
        </div>
      </section>
    </main>
  );
}