import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  MoveUpRight,
  ShieldCheck,
  Scissors,
  Store,
  UserRound,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const experiences = [
  {
    title: "HajaPro Tailor",
    description: "Orders and measurements",
    type: "tailor",
    className: "experience-tailor",
    Icon: Scissors,
  },
  {
    title: "HajaPro Retailer",
    description: "Products and sales",
    type: "trading",
    className: "experience-trading",
    Icon: Store,
  },
  {
    title: "HajaPro Customer",
    description: "Track your orders",
    type: "customer",
    className: "experience-customer",
    Icon: UserRound,
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> Product by MK Company</p>
            <h1>Make room for <em>better work.</em></h1>
            <p className="hero-description">Business essentials for tailors, retailers and their customers, brought into one secure place.</p>
            <div className="hero-actions">
              <Link className="button button-green" href="/sign-up?type=tailor">Set up your business <MoveUpRight size={17} /></Link>
              <Link className="text-link" href="#platform">Explore HajaPro <ArrowDownRight size={16} /></Link>
            </div>
            <p className="hero-tagline">Manage Smarter. Grow Faster.</p>
          </div>
          <div className="hero-art" aria-label="Three connected HajaPro experiences">
            <div className="hero-art-top"><span>ONE PLATFORM</span><span>THREE EXPERIENCES</span></div>
            <div className="hero-art-rows">
              <div className="hero-art-row"><span className="art-index">01</span><span className="art-rule" /><span className="art-name">Make</span><span className="art-tailor">Tailor</span></div>
              <div className="hero-art-row"><span className="art-index">02</span><span className="art-rule" /><span className="art-name">Trade</span><span className="art-trading">Retail</span></div>
              <div className="hero-art-row"><span className="art-index">03</span><span className="art-rule" /><span className="art-name">Track</span><span className="art-customer">Customer</span></div>
            </div>
            <div className="hero-art-bottom"><ShieldCheck size={16} /><span>Private by design</span><span className="hero-art-dot" /></div>
            <span className="hero-art-stamp" aria-hidden="true">HP<br />01</span>
          </div>
          <div className="hero-index" aria-hidden="true">01 / 03</div>
        </section>

        <section className="platform-section" id="platform">
          <div className="section-heading">
            <div><p className="eyebrow">Built around your kind of work</p><h2>Choose your<br /><em>workspace.</em></h2></div>
            <p>Choose the HajaPro space that fits what you do.</p>
          </div>
          <div className="experience-list">
            {experiences.map(({ title, description, type, className, Icon }) => (
              <Link
                className={`experience-row ${className}`}
                href={`/sign-up?type=${type}`}
                key={type}
              >
                <span className="experience-icon"><Icon size={20} strokeWidth={1.8} /></span>
                <span className="experience-main"><strong>{title}</strong><span>{description}</span></span>
                <span className="experience-arrow" aria-hidden="true"><ArrowRight size={19} /></span>
              </Link>
            ))}
          </div>
          <div className="foundation-note"><span className="foundation-check">✓</span><p><strong>Available now:</strong> secure registration and business workspace setup.</p></div>
        </section>
      </main>
      <footer className="site-footer"><Link className="wordmark" href="/">HAJA<span>PRO</span></Link><p>Manage Smarter. Grow Faster.</p><span>© 2026 MK Company</span></footer>
    </>
  );
}
