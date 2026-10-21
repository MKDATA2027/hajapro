"use client";

import Image from "next/image";
import { useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import { CustomersPanel, type CustomerRecord, type MeasurementRecord } from "@/app/workspace/customers-panel";
import {
  Bell, Bot, Boxes, CalendarClock, ChartNoAxesCombined, ChevronRight,
  ClipboardList, CreditCard, Home, LogOut, Menu, Package, Plus, Scissors, Users, Wallet,
} from "lucide-react";

type ModuleKey = "overview" | "customers" | "orders" | "products" | "reports" | "payments" | "overdue" | "notifications" | "ai" | "settings";

const moduleTitles: Record<ModuleKey, string> = {
  overview: "Home", customers: "Kwastomomi", orders: "Umarni", products: "Kayayyaki",
  reports: "Rahotanni", payments: "Biyan Kuɗi", overdue: "Ayyukan da suka makara",
  notifications: "Sanarwa", ai: "HAJAPRO AI", settings: "Saituna",
};

export function DashboardHome({ businessName, businessType, businessId, customers, measurements }: {
  businessName: string; businessType: string; businessId: string;
  customers: CustomerRecord[]; measurements: MeasurementRecord[];
}) {
  const [activeModule, setActiveModule] = useState<ModuleKey>("overview");
  const isTailor = businessType === "tailor";
  const go = (module: ModuleKey) => setActiveModule(module);

  return (
    <div className="haja-dashboard">
      <header className="haja-header">
        <div className="haja-brand">
          <Image src="/branding/hajapro-master-logo.jpg" alt="HAJAPRO — Product of MK Company" width={58} height={58} priority className="haja-brand-logo" />
          <div className="haja-brand-copy"><strong>HAJAPRO</strong><span>{isTailor ? "Tailor Business" : "Business"} · Dashboard</span></div>
        </div>
        <button className="haja-notifications" type="button" onClick={() => go("notifications")} aria-label="Buɗe sanarwa"><Bell size={25} /><i /></button>
      </header>

      {activeModule === "overview" ? (
        <main className="haja-dashboard-content">
          <button className="haja-income-card" type="button" onClick={() => go("payments")}>
            <span className="haja-income-copy">
              <span className="haja-income-label">Kudin shiga (This month)</span>
              <strong className="haja-income-value">—</strong>
              <span className="haja-income-note">Ana jiran haɗa bayanan kuɗi</span>
              <span className="haja-payment-label">{/* Language-aware label defaulting to Hausa */}Biyan Kuɗi</span>
            </span>
            <span className="haja-wallet-art"><Wallet size={53} strokeWidth={1.8} /></span>
          </button>

          <button className="haja-overdue-card" type="button" onClick={() => go("overdue")}>
            <span className="haja-overdue-icon"><CalendarClock size={36} /></span>
            <span className="haja-overdue-copy"><strong>Ayyukan da suka makara</strong><small>Duba ayyukan da suka wuce lokacin kammalawa</small></span>
            <ChevronRight className="haja-card-chevron" size={28} />
          </button>

          <section className="haja-shortcuts" aria-label="Manyan sassan dashboard">
            <button className="haja-shortcut haja-customers" type="button" onClick={() => go("customers")}>
              <span className="haja-shortcut-icon"><Users size={36} fill="currentColor" strokeWidth={1.5} /></span>
              <ChevronRight className="haja-card-chevron" size={26} />
              <strong>Kwastomomi</strong><small>Duba da sarrafa kwastomomi</small>
            </button>
            <button className="haja-shortcut haja-orders" type="button" onClick={() => go("orders")}>
              <span className="haja-shortcut-icon"><Scissors size={36} strokeWidth={2.4} /></span>
              <ChevronRight className="haja-card-chevron" size={26} />
              <strong>Umarni</strong><small>{isTailor ? "Sabon umarni ko duba na yanzu" : "Duba umarni da ayyukan yanzu"}</small>
            </button>
            <button className="haja-shortcut haja-products" type="button" onClick={() => go("products")}>
              <span className="haja-shortcut-icon"><Package size={36} strokeWidth={2.2} /></span>
              <ChevronRight className="haja-card-chevron" size={26} />
              <strong>Kayayyaki</strong><small>Duba kayayyaki da farashi</small>
            </button>
            <button className="haja-shortcut haja-reports" type="button" onClick={() => go("reports")}>
              <span className="haja-shortcut-icon"><ChartNoAxesCombined size={36} strokeWidth={2.4} /></span>
              <ChevronRight className="haja-card-chevron" size={26} />
              <strong>Rahotanni</strong><small>Duba kudin shiga da bayanan kasuwanci</small>
            </button>
          </section>

          <button className="haja-ai-card" type="button" onClick={() => go("ai")}>
            <span className="haja-ai-icon"><Bot size={35} /></span>
            <span className="haja-ai-copy"><strong>HAJAPRO AI</strong><small>Taimakon gudanar da sana’a</small></span>
            <ChevronRight className="haja-card-chevron" size={28} />
          </button>
        </main>
      ) : activeModule === "customers" ? (
        <div className="haja-subpage"><CustomersPanel businessId={businessId} initialCustomers={customers} initialMeasurements={measurements} /></div>
      ) : activeModule === "settings" ? (
          <main className="haja-subpage haja-settings-panel">
            <h1>Saituna</h1>
            <p>Sarrafa saitunan asusunka da fita daga HAJAPRO.</p>
            <form action={signOutAction}>
              <button className="haja-settings-signout" type="submit"><LogOut size={19} /> Sign out</button>
            </form>
          </main>
      ) : (
        <main className="haja-subpage haja-module-placeholder">
          <span className="haja-subpage-icon">{activeModule === "payments" ? <Wallet size={30} /> : activeModule === "orders" ? <ClipboardList size={30} /> : activeModule === "products" ? <Boxes size={30} /> : activeModule === "reports" ? <ChartNoAxesCombined size={30} /> : activeModule === "ai" ? <Bot size={30} /> : activeModule === "overdue" ? <CalendarClock size={30} /> : activeModule === "notifications" ? <Bell size={30} /> : <CreditCard size={30} />}</span>
          <h1>{moduleTitles[activeModule]}</h1>
          <p>Wannan sashe yana cikin tsarin HAJAPRO. Za a haɗa shi da bayanan kasuwanci masu inganci yayin kammala wannan module.</p>
          <button type="button" className="haja-back-home" onClick={() => go("overview")}>Komawa Home</button>
        </main>
      )}

      <nav className="haja-bottom-nav" aria-label="Babban menu">
        <button className={activeModule === "overview" ? "is-active" : ""} type="button" onClick={() => go("overview")}><Home size={25} fill={activeModule === "overview" ? "currentColor" : "none"} /><span>Home</span></button>
        <button className={activeModule === "orders" ? "is-active" : ""} type="button" onClick={() => go("orders")}><ClipboardList size={25} /><span>Orders</span></button>
        <button className="haja-add-button" type="button" onClick={() => go("orders")} aria-label="Ƙara sabon umarni"><Plus size={36} strokeWidth={2.7} /></button>
        <button className={activeModule === "customers" ? "is-active" : ""} type="button" onClick={() => go("customers")}><Users size={25} /><span>Customers</span></button>
        <button className={activeModule === "settings" ? "is-active" : ""} type="button" onClick={() => go("settings")}><Menu size={27} /><span>More</span></button>
      </nav>
    </div>
  );
}
