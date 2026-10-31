"use client";

import { useState } from "react";
import {
  AlertTriangle, BarChart3, Bot, Boxes, ChevronRight, CircleDollarSign,
  ClipboardList, Home, Package, Plus, ShoppingBag, ShoppingCart,
  Truck, Users, Wallet, X,
} from "lucide-react";

type Product = {
  id: string; name: string; sku: string | null; unit_price: number | string;
  stock_quantity: number | string; low_stock_threshold: number | string;
};
type Props = {
  businessName: string;
  role: "owner" | "manager" | "staff";
  products: Product[];
  customerCount: number;
  todayPaymentCount: number;
  hasSalesSource: boolean;
  canViewInventoryValue: boolean;
  canViewReports: boolean;
  canViewProfit: boolean;
};

const money = (value: number) => "₦" + new Intl.NumberFormat("en-NG", {
  style: "decimal", maximumFractionDigits: 0,
}).format(value);

export function RetailerDashboard({
  businessName, role, products, customerCount,
  todayPaymentCount, hasSalesSource,
  canViewInventoryValue, canViewReports, canViewProfit,
}: Props) {
  const [showLowStock, setShowLowStock] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const lowStock = products.filter((p) =>
    Number(p.stock_quantity) <= Number(p.low_stock_threshold),
  );
   const naira = (value: number) => money(value);

  return (
    <main className="trading-dashboard" aria-label="Allon kasuwancin sayarwa">
      <header className="trading-header">
        <div className="trading-brand-mark"><ShoppingBag size={21} /></div>
        <div className="trading-brand-copy">
          <strong>MK BUSINESS MANAGER <span>KASUWANCI</span></strong>
          <small>{businessName}</small>
        </div>
        <span className="trading-role">{role === "owner" ? "MAI SHAGO" : role === "manager" ? "MANAJA" : "MAI SAYA"}</span>
      </header>

      <section className="trading-hero" aria-label="Sayarwa ta yau">
        <div className="trading-hero-top">
          <span>SAYARWA YAU</span>
          <span className="trading-live-dot">AWAITING DATA</span>
        </div>
        <strong className="trading-sales-value">
          {"—"}
        </strong>
        <div className="trading-hero-bottom">
          <span>{hasSalesSource ? `${todayPaymentCount} ma’amaloli` : "Ba a haɗa bayanan sayarwa ba tukuna"}</span>
          <span className="trading-hero-compare">{hasSalesSource ? "Idan aka kwatanta da jiya" : "Babu ƙididdigar zato"}</span>
        </div>
      </section>

      <button
        className={`trading-low-stock-alert${lowStock.length ? "" : " is-clear"}`}
        type="button"
        onClick={() => setShowLowStock(true)}
        aria-label={`Buɗe kayan da suka kusa ƙarewa. ${lowStock.length} kaya`}
      >
        <AlertTriangle size={18} />
        <strong>{lowStock.length ? `${lowStock.length} kaya sun kusa ƙarewa` : "Komai yana da kyau"}</strong>
        <span>Duba jerin</span>
        <ChevronRight size={17} />
      </button>

      <section className="trading-main-tiles" aria-label="Sassan kasuwanci">
        <div className="trading-tile trading-sales-tile">
          <span className="trading-tile-icon"><ShoppingCart size={22} /></span>
          <strong>Sayarwa</strong>
          <small>{hasSalesSource ? `${todayPaymentCount} yau` : "Bayanan sayarwa"}</small>
        </div>
        <div className="trading-tile trading-products-tile">
          <span className="trading-tile-icon"><Package size={22} /></span>
          <strong>Kayayyaki</strong>
          <small>{products.length} kayayyaki</small>
        </div>
        <div className="trading-tile trading-inventory-tile">
          <span className="trading-tile-icon"><Boxes size={22} /></span>
          <strong>Kayan ajiya</strong>
          <small>{!products.length ? "Babu kaya tukuna" : canViewInventoryValue ? "Darajar saye ba ta samuwa tukuna" : `${products.reduce((sum, product) => sum + Number(product.stock_quantity), 0)} raka’a a ajiya`}</small>
          {lowStock.length > 0 && <i className="trading-tile-alert-count">{lowStock.length}</i>}
        </div>
        <div className="trading-tile trading-customers-tile">
          <span className="trading-tile-icon"><Users size={22} /></span>
          <strong>Kwastomomi</strong>
          <small>{customerCount} kwastomomi · bashin —</small>
        </div>
        <div className="trading-tile trading-suppliers-tile">
          <span className="trading-tile-icon"><Truck size={22} /></span>
          <strong>Masu kawo kaya</strong>
          <small>Bayanan masu kawo kaya · bashin —</small>
        </div>
        <div className="trading-tile trading-expenses-tile">
          <span className="trading-tile-icon"><Wallet size={22} /></span>
          <strong>Kuɗin gudanarwa</strong>
          <small>Bayanan kuɗin gudanarwa</small>
        </div>
      </section>

      <section className="trading-mini-tiles" aria-label="Rahotanni da taimako">
        {canViewReports ? (
          <div className="trading-mini-tile trading-reports-tile">
            <BarChart3 size={20} />
            <span><strong>Rahotanni</strong><small>{canViewProfit ? "Ribar da aka ƙididdiga —" : "Rahotannin sayarwa da ayyuka"}</small></span>
            <ChevronRight size={16} />
          </div>
        ) : (
          <div className="trading-mini-tile trading-reports-tile is-restricted" aria-label="An takaita rahotanni">
            <BarChart3 size={20} />
            <span><strong>Rahotanni</strong><small>Ana buƙatar izinin mai shago</small></span>
            <span className="trading-lock">LOCKED</span>
          </div>
        )}
        <div className="trading-mini-tile trading-ai-tile">
          <Bot size={21} />
          <span><strong>Mataimakin AI</strong><small>Taimakon kasuwanci</small></span>
          <ChevronRight size={16} />
        </div>
      </section>

      <nav className="trading-bottom-nav" aria-label="Babban menu">
        <button type="button" className="is-active"><Home size={19} /><span>Gida</span></button>
        <button type="button" disabled aria-label="Za a haɗa menu da tsarin sayarwa"><ClipboardList size={19} /><span>Sayarwa</span></button>
        <button type="button" className="trading-nav-add" onClick={() => setShowQuickAdd(true)} aria-label="Ayyukan gaggawa"><Plus size={25} /></button>
        <button type="button" disabled aria-label="Za a haɗa menu da tsarin kayayyaki"><Package size={19} /><span>Kayayyaki</span></button>
        <button type="button" disabled aria-label="Ƙarin sassa"><span className="trading-more-dots">•••</span><span>Kari</span></button>
      </nav>

      {showLowStock && (
        <div className="trading-overlay" role="presentation" onClick={() => setShowLowStock(false)}>
          <section className="trading-sheet" role="dialog" aria-modal="true" aria-labelledby="low-stock-title" onClick={(event) => event.stopPropagation()}>
            <div className="trading-sheet-heading">
              <div><span className="trading-sheet-eyebrow">GARGADIN KAYAN AJIYA</span><h2 id="low-stock-title">Kayayyakin da suka kusa ƙarewa</h2></div>
              <button type="button" onClick={() => setShowLowStock(false)} aria-label="Rufe"><X size={21} /></button>
            </div>
            {lowStock.length ? (
              <ul className="trading-low-stock-list">
                {lowStock.map((product) => (
                  <li key={product.id}>
                    <span><strong>{product.name}</strong><small>{product.sku || "Babu SKU"}</small></span>
                    <span className="trading-stock-quantity">{Number(product.stock_quantity)} left</span>
                  </li>
                ))}
              </ul>
            ) : <p className="trading-empty-state">Dukkan kayayyaki suna da isasshen adadi a ajiya.</p>}
          </section>
        </div>
      )}

      {showQuickAdd && (
        <div className="trading-overlay" role="presentation" onClick={() => setShowQuickAdd(false)}>
          <section className="trading-sheet trading-quick-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-add-title" onClick={(event) => event.stopPropagation()}>
            <div className="trading-sheet-heading">
              <div><span className="trading-sheet-eyebrow">AYYUKAN GAGGAWA</span><h2 id="quick-add-title">Ƙirƙiri sabo</h2></div>
              <button type="button" onClick={() => setShowQuickAdd(false)} aria-label="Rufe"><X size={21} /></button>
            </div>
            {[
              { label: "Sabuwar sayarwa", Icon: ShoppingCart },
              { label: "Ƙara kaya a ajiya", Icon: Boxes },
              { label: "Ƙara sabon kaya", Icon: Package },
              { label: "Rubuta kuɗin gudanarwa", Icon: CircleDollarSign },
              { label: "Sabon kwastoma", Icon: Users },
            ].map(({ label, Icon }) => (
              <button className="trading-quick-action" type="button" key={label} disabled>
                <Icon size={19} /><span>{label}</span><small>Setup pending</small>
              </button>
            ))}
            <p className="trading-sheet-note">Za a haɗa waɗannan ayyuka da ingantattun hanyoyinsu bayan an kammala sassan su.</p>
          </section>
        </div>
      )}
    </main>
  );
}
