"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import { CustomersPanel, type CustomerRecord, type MeasurementRecord } from "@/app/workspace/customers-panel";
import { BusinessModulePanel } from "@/app/workspace/business-modules";
import {
  Bell, Bot, CalendarClock, ChartNoAxesCombined, ChevronRight,
  ClipboardList, Home, LogOut, Menu, Package, Plus, Scissors, Users, Wallet,
} from "lucide-react";

type ModuleKey = "overview" | "customers" | "orders" | "products" | "reports" | "payments" | "overdue" | "notifications" | "ai" | "settings";


export function DashboardHome({ businessType, businessId, customers, measurements, orders, products, payments, notifications }: {
  businessType: string; businessId: string;
  customers: CustomerRecord[]; measurements: MeasurementRecord[];
  orders: { id: string; title: string; status: string; total_amount: number | string; deposit_amount: number | string; due_date: string | null; created_at: string; customer_id: string | null }[];
  products: { id: string; name: string; sku: string | null; category: string | null; unit_price: number | string; stock_quantity: number | string; low_stock_threshold: number | string }[];
  payments: { id: string; order_id: string; amount: number | string; payment_method: string; status: string; created_at: string; verified_at: string | null }[];
  notifications: { id: string; title: string; body: string; read_at: string | null; created_at: string }[];
}) {
  const [activeModule, setActiveModule] = useState<ModuleKey>("overview");
  const [language, setLanguage] = useState<"ha" | "en">("ha");
  useEffect(() => { const saved = window.localStorage.getItem("hajapro-language"); if (saved === "ha" || saved === "en") { setLanguage(saved); document.documentElement.lang = saved; } }, []);
  const changeLanguage = (value: "ha" | "en") => { window.localStorage.setItem("hajapro-language", value); setLanguage(value); document.documentElement.lang = value; };
  const [quickCreateOrder, setQuickCreateOrder] = useState(false);
  const isTailor = businessType === "tailor";
  const t = (ha: string, en: string) => language === "ha" ? ha : en;
  const currentDate = new Date();
  const currentMonthIncome = payments.filter((payment) => { const paidDate = new Date(payment.verified_at ?? payment.created_at); return payment.status === "verified" && paidDate.getFullYear() === currentDate.getFullYear() && paidDate.getMonth() === currentDate.getMonth(); }).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const formatMoney = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(amount);
  const go = (module: ModuleKey) => { setActiveModule(module); setQuickCreateOrder(false); };

  return (
    <div className="haja-dashboard">
      <header className="haja-header">
        <div className="haja-brand">
          <Image src="/branding/hajapro-master-logo.jpg" alt="HAJAPRO — Product of MK Company" width={58} height={58} priority unoptimized className="haja-brand-logo" />
          <div className="haja-brand-copy"><strong>HAJAPRO</strong><span>{isTailor ? "Tailor Business" : "Business"} · Dashboard</span></div>
        </div>
        <button className="haja-notifications" type="button" onClick={() => go("notifications")} aria-label="Buɗe sanarwa"><Bell size={25} />{notifications.some((notification) => !notification.read_at) && <i />}</button>
      </header>

      {activeModule === "overview" ? (
        <main className="haja-dashboard-content">
          <button className="haja-income-card" type="button" onClick={() => go("payments")}>
            <span className="haja-income-copy">
              <span className="haja-income-label">{t("Kuɗin shiga (Wannan watan)", "Income (This month)")}</span>
              <strong className="haja-income-value">{formatMoney(currentMonthIncome)}</strong>
              <span className="haja-income-note">{currentMonthIncome > 0 ? (language === "ha" ? "Kuɗin da aka tabbatar wannan watan" : "Verified payments this month") : (language === "ha" ? "Babu biyan kuɗi da aka tabbatar wannan watan" : "No verified payments this month")}</span>
              <span className="haja-payment-label">{/* Language-aware label defaulting to Hausa */}{language === "ha" ? "Biyan Kuɗi" : "Payment"}</span>
            </span>
            <span className="haja-wallet-group"><span className="haja-wallet-art"><Wallet size={53} strokeWidth={1.8} /></span><span className="haja-wallet-label">{t("Walat", "Wallet")}</span></span>
          </button>

          <button className="haja-overdue-card" type="button" onClick={() => go("overdue")}>
            <span className="haja-overdue-icon"><CalendarClock size={36} /></span>
            <span className="haja-overdue-copy"><strong>{t("Ayyukan da suka makara", "Overdue work")}</strong><small>{t("Duba ayyukan da suka wuce lokacin kammalawa", "Review work past its due date")}</small></span>
            <ChevronRight className="haja-card-chevron" size={28} />
          </button>

          <section className="haja-shortcuts" aria-label={t("Manyan sassan dashboard", "Dashboard shortcuts")}>
            <button className="haja-shortcut haja-customers" type="button" onClick={() => go("customers")}>
              <span className="haja-shortcut-icon"><Users size={36} fill="currentColor" strokeWidth={1.5} /></span>
              <ChevronRight className="haja-card-chevron" size={26} />
              <strong>{t("Kwastomomi", "Customers")}</strong><small>{t("Duba da sarrafa kwastomomi", "View and manage customers")}</small>
            </button>
            <button className="haja-shortcut haja-orders" type="button" onClick={() => go("orders")}>
              <span className="haja-shortcut-icon"><Scissors size={36} strokeWidth={2.4} /></span>
              <ChevronRight className="haja-card-chevron" size={26} />
              <strong>{t("Umarni", "Orders")}</strong><small>{isTailor ? t("Ƙirƙiri sabon oda ko duba na yanzu", "Create an order or review current work") : t("Duba umarni da ayyukan yanzu", "View orders and current work")}</small>
            </button>
            <button className="haja-shortcut haja-products" type="button" onClick={() => go("products")}>
              <span className="haja-shortcut-icon"><Package size={36} strokeWidth={2.2} /></span>
              <ChevronRight className="haja-card-chevron" size={26} />
              <strong>{t("Kayayyaki", "Products")}</strong><small>{t("Duba kayayyaki da farashi", "View products and prices")}</small>
            </button>
            <button className="haja-shortcut haja-reports" type="button" onClick={() => go("reports")}>
              <span className="haja-shortcut-icon"><ChartNoAxesCombined size={36} strokeWidth={2.4} /></span>
              <ChevronRight className="haja-card-chevron" size={26} />
              <strong>{t("Rahotanni", "Reports")}</strong><small>{t("Duba kuɗin shiga da bayanan kasuwanci", "Review revenue and business data")}</small>
            </button>
          </section>

          <button className="haja-ai-card" type="button" onClick={() => go("ai")}>
            <span className="haja-ai-icon"><Bot size={35} /></span>
            <span className="haja-ai-copy"><strong>HAJAPRO AI</strong><small>{t("Taimakon gudanar da sana’a", "Business management assistance")}</small></span>
            <ChevronRight className="haja-card-chevron" size={28} />
          </button>
        </main>
      ) : activeModule === "customers" ? (
        <div className="haja-subpage"><CustomersPanel businessId={businessId} initialCustomers={customers} initialMeasurements={measurements} language={language} /></div>
      ) : activeModule === "settings" ? (
          <main className="haja-subpage haja-settings-panel">
            <h1>{t("Saituna", "Settings")}</h1>
            <p>{t("Sarrafa harshen manhaja da saitunan asusunka.", "Manage your app language and account settings.")}</p>
            <section className="haja-language-settings" aria-label="App language"><h2>{t("Harshe", "Language")}</h2><div><button type="button" className={language === "ha" ? "is-selected" : ""} onClick={() => changeLanguage("ha")}>Hausa</button><button type="button" className={language === "en" ? "is-selected" : ""} onClick={() => changeLanguage("en")}>English</button></div></section>
            <form action={signOutAction}>
              <button className="haja-settings-signout" type="submit"><LogOut size={19} /> {t("Fita daga asusu", "Sign out")}</button>
            </form>
          </main>
      ) : (
        <div className="haja-subpage">
          <BusinessModulePanel language={language} module={activeModule} initialCreateOrder={quickCreateOrder} businessId={businessId} customers={customers.map(({id,full_name})=>({id,full_name}))} orders={orders} products={products} payments={payments} notifications={notifications} />
        </div>
      )}

      <nav className="haja-bottom-nav" aria-label="Babban menu">
        <button className={activeModule === "overview" ? "is-active" : ""} type="button" onClick={() => go("overview")}><Home size={25} fill={activeModule === "overview" ? "currentColor" : "none"} /><span>{t("Gida", "Home")}</span></button>
        <button className={activeModule === "orders" ? "is-active" : ""} type="button" onClick={() => go("orders")}><ClipboardList size={25} /><span>{t("Umarni", "Orders")}</span></button>
        <button className="haja-add-button" type="button" onClick={() => { setQuickCreateOrder(true); setActiveModule("orders"); }} aria-label={t("Ƙara sabon umarni", "Add a new order")}><Plus size={36} strokeWidth={2.7} /></button>
        <button className={activeModule === "customers" ? "is-active" : ""} type="button" onClick={() => go("customers")}><Users size={25} /><span>{t("Kwastomomi", "Customers")}</span></button>
        <button className={activeModule === "settings" ? "is-active" : ""} type="button" onClick={() => go("settings")}><Menu size={27} /><span>{t("Ƙari", "More")}</span></button>
      </nav>
    </div>
  );
}
