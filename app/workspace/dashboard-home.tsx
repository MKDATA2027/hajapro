"use client";

import { useState } from "react";
import {
  Bell,
  Bot,
  Boxes,
  CalendarClock,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Package,
  Search,
  Settings2,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

type ModuleKey =
  | "overview"
  | "customers"
  | "orders"
  | "products"
  | "reports"
  | "payments"
  | "overdue"
  | "notifications"
  | "ai"
  | "settings";

const modules: {
  key: ModuleKey;
  label: string;
  description: string;
  icon: typeof Users;
}[] = [
  { key: "customers", label: "Customers", description: "Profiles and measurements", icon: Users },
  { key: "orders", label: "Orders", description: "Track work from start to delivery", icon: ClipboardList },
  { key: "products", label: "Products", description: "Your product catalogue", icon: ShoppingBag },
  { key: "reports", label: "Reports", description: "Business performance", icon: ChartNoAxesCombined },
  { key: "overdue", label: "Overdue work", description: "Work that needs attention", icon: CalendarClock },
  { key: "notifications", label: "Notifications", description: "Important updates and reminders", icon: Bell },
];

const moduleTitles: Record<ModuleKey, string> = {
  overview: "Overview",
  customers: "Customers",
  orders: "Orders",
  products: "Products",
  reports: "Reports",
  payments: "Payments",
  overdue: "Overdue work",
  notifications: "Notifications",
  ai: "HAJAPRO AI",
  settings: "Settings",
};

export function DashboardHome({ businessName, businessType }: { businessName: string; businessType: string }) {
  const [activeModule, setActiveModule] = useState<ModuleKey>("overview");
  const [searchValue, setSearchValue] = useState("");
  const isTailor = businessType === "tailor";

  function openModule(module: ModuleKey) {
    setActiveModule(module);
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-mark">H</span>
          <span>HAJA<strong>PRO</strong></span>
        </div>
        <p className="dashboard-nav-label">WORKSPACE</p>
        <nav className="dashboard-nav" aria-label="Workspace navigation">
          <button className={activeModule === "overview" ? "dashboard-nav-item is-active" : "dashboard-nav-item"} onClick={() => openModule("overview")} type="button"><LayoutDashboard size={18} /> Overview</button>
          {modules.slice(0, 3).map((item) => {
            const Icon = item.icon;
            return <button key={item.key} className={activeModule === item.key ? "dashboard-nav-item is-active" : "dashboard-nav-item"} onClick={() => openModule(item.key)} type="button"><Icon size={18} /> {item.label}</button>;
          })}
          <button className={activeModule === "payments" ? "dashboard-nav-item is-active" : "dashboard-nav-item"} onClick={() => openModule("payments")} type="button"><CreditCard size={18} /> Payments</button>
          {modules.slice(3).map((item) => {
            const Icon = item.icon;
            return <button key={item.key} className={activeModule === item.key ? "dashboard-nav-item is-active" : "dashboard-nav-item"} onClick={() => openModule(item.key)} type="button"><Icon size={18} /> {item.label}</button>;
          })}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <button className={activeModule === "ai" ? "dashboard-nav-item is-active" : "dashboard-nav-item"} onClick={() => openModule("ai")} type="button"><Bot size={18} /> HAJAPRO AI</button>
          <button className={activeModule === "settings" ? "dashboard-nav-item is-active" : "dashboard-nav-item"} onClick={() => openModule("settings")} type="button"><Settings2 size={18} /> Settings</button>
          <div className="dashboard-account"><span className="dashboard-avatar">{businessName.slice(0, 1).toUpperCase()}</span><span><strong>{businessName}</strong><small>{isTailor ? "Tailoring business" : "Trading business"}</small></span></div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">Workspace <ChevronRight size={14} /> <strong>{moduleTitles[activeModule]}</strong></div>
          <div className="dashboard-top-actions">
            <label className="dashboard-search"><Search size={16} /><input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search workspace" aria-label="Search workspace" /></label>
            <button className="dashboard-icon-button" type="button" onClick={() => openModule("notifications")} aria-label="Open notifications"><Bell size={18} /></button>
          </div>
        </header>

        {activeModule === "overview" ? (
          <section className="dashboard-content">
            <div className="dashboard-greeting">
              <div><p className="dashboard-eyebrow">YOUR BUSINESS AT A GLANCE</p><h1>Welcome back.</h1><p>Manage your {isTailor ? "tailoring business" : "trading business"} from one place.</p></div>
              <span className="dashboard-date-chip">HAJAPRO WORKSPACE</span>
            </div>

            <div className="dashboard-metric-grid">
              <button className="dashboard-metric-card dashboard-wallet-card" type="button" onClick={() => openModule("payments")}>
                <span className="dashboard-metric-icon"><Wallet size={20} /></span><span className="dashboard-metric-label">Income wallet</span><strong className="dashboard-metric-value">—</strong><span className="dashboard-wallet-link">Payment <ChevronRight size={14} /></span>
              </button>
              <div className="dashboard-metric-card"><span className="dashboard-metric-icon"><ClipboardList size={20} /></span><span className="dashboard-metric-label">Active orders</span><strong className="dashboard-metric-value">—</strong><span className="dashboard-metric-note">Awaiting database connection</span></div>
              <div className="dashboard-metric-card"><span className="dashboard-metric-icon"><Users size={20} /></span><span className="dashboard-metric-label">Customers</span><strong className="dashboard-metric-value">—</strong><span className="dashboard-metric-note">Awaiting database connection</span></div>
              <div className="dashboard-metric-card"><span className="dashboard-metric-icon"><Boxes size={20} /></span><span className="dashboard-metric-label">{isTailor ? "Materials" : "Stock items"}</span><strong className="dashboard-metric-value">—</strong><span className="dashboard-metric-note">Awaiting database connection</span></div>
            </div>

            <div className="dashboard-section-heading"><div><p className="dashboard-eyebrow">WORKSPACE TOOLS</p><h2>What would you like to do?</h2></div></div>
            <div className="dashboard-module-grid">
              {modules.map((item) => {
                const Icon = item.icon;
                return <button key={item.key} type="button" className="dashboard-module-card" onClick={() => openModule(item.key)}><span className="dashboard-module-icon"><Icon size={19} /></span><span className="dashboard-module-copy"><strong>{item.label}</strong><small>{item.description}</small></span><ChevronRight size={17} className="dashboard-module-arrow" /></button>;
              })}
              <button type="button" className="dashboard-module-card" onClick={() => openModule("ai")}><span className="dashboard-module-icon dashboard-ai-icon"><Bot size={19} /></span><span className="dashboard-module-copy"><strong>HAJAPRO AI</strong><small>Business guidance and insights</small></span><ChevronRight size={17} className="dashboard-module-arrow" /></button>
            </div>
            <p className="dashboard-integrity-note"><CircleHelp size={15} /> Business figures will appear after the relevant database modules are connected. No sample figures are being shown.</p>
          </section>
        ) : (
          <section className="dashboard-content dashboard-module-empty">
            <span className="dashboard-empty-icon">{activeModule === "products" ? <Package size={24} /> : activeModule === "payments" ? <Wallet size={24} /> : activeModule === "customers" ? <Users size={24} /> : activeModule === "ai" ? <Bot size={24} /> : <ClipboardList size={24} />}</span>
            <p className="dashboard-eyebrow">HAJAPRO WORKSPACE</p>
            <h1>{moduleTitles[activeModule]}</h1>
            <p>This section is part of the dashboard plan. It will be connected to secure business records as its module is implemented.</p>
            <button className="dashboard-back-button" type="button" onClick={() => openModule("overview")}>Back to overview</button>
          </section>
        )}
      </main>
    </div>
  );
}
