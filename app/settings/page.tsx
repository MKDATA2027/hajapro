import Link from "next/link";

const roles = [
  { type: "tailor", title: "Tailor", description: "Orders, measurements and production", route: "/tailor" },
  { type: "trading", title: "Retailer", description: "Products, stock and sales", route: "/retailer" },
  { type: "customer", title: "Customer", description: "Customer account and order access", route: "/customer" },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="role-shell">
    <Link className="wordmark" href="/">HAJA<span>PRO</span></Link>
    <p className="eyebrow">Account settings</p><h1>Choose your experience.</h1>
    <p className="role-lead">Open a public preview without signing in. Sign in or create an account from the selected experience when you need private account features.</p>
    {error ? <p className="notice notice-error">{error}</p> : null}
    <div className="role-grid">{roles.map(role => <article className="role-card" key={role.type}>
      <h2>{role.title}</h2><p>{role.description}</p>
      <Link className="button button-dark" href={role.route}>Open {role.title}</Link>
      <Link className="role-auth-link" href={`/sign-in?type=${role.type}`}>Sign in</Link>
      <Link className="role-auth-link" href={`/sign-up?type=${role.type}`}>Create account</Link>
    </article>)}</div>
    <Link className="back-link" href="/">Back to home</Link>
  </main>;
}