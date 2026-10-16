import Link from "next/link";
import { ArrowDownRight, ArrowRight, MoveUpRight, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const experiences = [
  {
    number: "01",
    title: "HajaPro Tailor",
    description: "A clearer path from customer details to finished orders.",
    detail: "Orders, measurements, production",
    type: "tailor",
    className: "experience-tailor",
    available: "Workspace setup available",
  },
  {
    number: "02",
    title: "HajaPro Trading",
    description: "Bring products, stock and everyday business activity together.",
    detail: "Catalog, inventory, sales",
    type: "trading",
    className: "experience-trading",
    available: "Workspace setup available",
  },
  {
    number: "03",
    title: "HajaPro Customer",
    description: "Follow order progress across the shops you work with.",
    detail: "Verified order tracking",
    type: "customer",
    className: "experience-customer",
    available: "Customer dashboard planned",
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
            <p className="hero-description">The business essentials for tailors, retailers and the people who count on them, brought into one secure place.</p>
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
            <div><p className="eyebrow">Built around your kind of work</p><h2>One platform.<br /><em>Room to grow.</em></h2></div>
            <p>Start with the workspace that fits your business. Secure accounts and private business data are the foundation; focused tools are arriving in milestones.</p>
          </div>
          <div className="experience-list">
            {experiences.map((experience) => (
              <Link
                className={`experience-row ${experience.className}`}
                href={`/sign-up?type=${experience.type}`}
                key={experience.number}
              >
                <span className="experience-number">{experience.number}</span>
                <span className="experience-main"><strong>{experience.title}</strong><span>{experience.description}</span></span>
                <span className="experience-detail">{experience.detail}</span>
                <span className="experience-availability">{experience.available}</span>
                <span className="experience-arrow"><ArrowRight size={18} /></span>
              </Link>
            ))}
          </div>
          <div className="foundation-note"><span className="foundation-check">✓</span><p><strong>Available now:</strong> account registration, secure sign-in and private business workspace setup.</p></div>
        </section>

        <section className="closing-band">
          <div><p className="eyebrow">Your next chapter starts here</p><h2>Build a business<br /><em>that feels in hand.</em></h2></div>
          <Link className="button button-light" href="/sign-up?type=tailor">Create an account <MoveUpRight size={17} /></Link>
          <span className="closing-caption">HAJAPRO · PRODUCT BY MK COMPANY</span>
        </section>
      </main>
      <footer className="site-footer"><Link className="wordmark" href="/">HAJA<span>PRO</span></Link><p>Manage Smarter. Grow Faster.</p><span>© 2026 MK Company</span></footer>
    </>
  );
}