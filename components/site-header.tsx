import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="HajaPro home">
        HAJA<span>PRO</span>
      </Link>
      <nav aria-label="Main navigation" className="header-nav">
        <Link href="#platform">Platform</Link>
        <Link className="header-signin" href="/sign-in">Sign in</Link>
        <Link className="button button-dark header-cta" href="/sign-up?type=tailor">
          Get started <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
  );
}