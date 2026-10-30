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
};

const money = (value: number) => new Intl.NumberFormat("en-NG", {
  style: "currency", currency: "NGN", maximumFractionDigits: 0,
}).format(value);

export function RetailerDashboard({
  businessName, role, products, customerCount,
  todayPaymentCount, hasSalesSource,
}: Props) {
  const [showLowStock, setShowLowStock] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const lowStock = products.filter((p) =>
    Number(p.stock_quantity) <= Number(p.low_stock_threshold),
  );
  const inventoryRetailValue = products.reduce(
    (sum, p) => sum + Number(p.unit_price) * Number(p.stock_quantity), 0,
  );
  const canViewReports = role === "owner" || role === "manager";
  const naira = (value: number) => money(value);

  return (
    <main className="trading-dashboard" aria-label="Trading business dashboard">
      <header className="trading-header">
        <div className="trading-brand-mark"><ShoppingBag size={21} /></div>
        <div className="trading-brand-copy">
          <strong>HAJAPRO <span>TRADING</span></strong>
          <small>{businessName}</small>
        </div>
        <span className="trading-role">{role === "owner" ? "OWNER" : role === "manager" ? "MANAGER" : "CASHIER"}</span>
      </header>

      <section className="trading-hero" aria-label="Sales today">
        <div className="trading-hero-top">
          <span>SALES TODAY</span>
          <span className="trading-live-dot">LIVE DATA</span>
        </div>
        <strong className="trading-sales-value">
          {hasSalesSource ? naira(todayPayments) : "—"}
        </strong>
        <div className="trading-hero-bottom">
          <span>{hasSalesSource ? `${todayPaymentCount} transactions` : "Sales tracking data not connected yet"}</span>
          <span className="trading-hero-compare">{hasSalesSource ? "Compared with yesterday" : "No estimated figures"}</span>
        </div>
      </section>

      <button
        className={`trading-low-stock-alert${lowStock.length ? "" : " is-clear"}`}
        type="button"
        onClick={() => setShowLowStock(true)}
        aria-label={`Open low stock products. ${lowStock.length} items`}
      >
        <AlertTriangle size={18} />
        <strong>{lowStock.length} {lowStock.length === 1 ? "product is" : "products are"} low in stock</strong>
        <span>View list</span>
        <ChevronRight size={17} />
      </button>

      <section className="trading-main-tiles" aria-label="Business modules">
        <div className="trading-tile trading-sales-tile">
          <span className="trading-tile-icon"><ShoppingCart size={22} /></span>
          <strong>Sales</strong>
          <small>{hasSalesSource ? `${todayPaymentCount} today` : "Sales records"}</small>
        </div>
        <div className="trading-tile trading-products-tile">
          <span className="trading-tile-icon"><Package size={22} /></span>
          <strong>Products</strong>
          <small>{products.length} products</small>
        </div>
        <div className="trading-tile trading-inventory-tile">
          <span className="trading-tile-icon"><Boxes size={22} /></span>
          <strong>Inventory</strong>
          <small>{products.length ? naira(inventoryRetailValue) + " retail value" : "No products yet"}</small>
          {lowStock.length > 0 && <i className="trading-tile-alert-count">{lowStock.length}</i>}
        </div>
        <div className="trading-tile trading-customers-tile">
          <span className="trading-tile-icon"><Users size={22} /></span>
          <strong>Customers</strong>
          <small>{customerCount} customers · debt —</small>
        </div>
        <div className="trading-tile trading-suppliers-tile">
          <span className="trading-tile-icon"><Truck size={22} /></span>
          <strong>Suppliers</strong>
          <small>Supplier records · payable —</small>
        </div>
        <div className="trading-tile trading-expenses-tile">
          <span className="trading-tile-icon"><Wallet size={22} /></span>
          <strong>Expenses</strong>
          <small>Expense records</small>
        </div>
      </section>

      <section className="trading-mini-tiles" aria-label="Business insights">
        {canViewReports ? (
          <div className="trading-mini-tile trading-reports-tile">
            <BarChart3 size={20} />
            <span><strong>Reports</strong><small>Calculated profit —</small></span>
            <ChevronRight size={16} />
          </div>
        ) : (
          <div className="trading-mini-tile trading-reports-tile is-restricted" aria-label="Reports restricted">
            <BarChart3 size={20} />
            <span><strong>Reports</strong><small>Owner permission required</small></span>
            <span className="trading-lock">LOCKED</span>
          </div>
        )}
        <div className="trading-mini-tile trading-ai-tile">
          <Bot size={21} />
          <span><strong>AI Assistant</strong><small>Business support</small></span>
          <ChevronRight size={16} />
        </div>
      </section>

      <nav className="trading-bottom-nav" aria-label="Main navigation">
        <button type="button" className="is-active"><Home size={19} /><span>Home</span></button>
        <button type="button"><ClipboardList size={19} /><span>Sales</span></button>
        <button type="button" className="trading-nav-add" onClick={() => setShowQuickAdd(true)} aria-label="Quick actions"><Plus size={25} /></button>
        <button type="button"><Package size={19} /><span>Products</span></button>
        <button type="button"><span className="trading-more-dots">•••</span><span>More</span></button>
      </nav>

      {showLowStock && (
        <div className="trading-overlay" role="presentation" onClick={() => setShowLowStock(false)}>
          <section className="trading-sheet" role="dialog" aria-modal="true" aria-labelledby="low-stock-title" onClick={(event) => event.stopPropagation()}>
            <div className="trading-sheet-heading">
              <div><span className="trading-sheet-eyebrow">INVENTORY ALERT</span><h2 id="low-stock-title">Low stock products</h2></div>
              <button type="button" onClick={() => setShowLowStock(false)} aria-label="Close"><X size={21} /></button>
            </div>
            {lowStock.length ? (
              <ul className="trading-low-stock-list">
                {lowStock.map((product) => (
                  <li key={product.id}>
                    <span><strong>{product.name}</strong><small>{product.sku || "No SKU"}</small></span>
                    <span className="trading-stock-quantity">{Number(product.stock_quantity)} left</span>
                  </li>
                ))}
              </ul>
            ) : <p className="trading-empty-state">All products are above their low-stock thresholds.</p>}
          </section>
        </div>
      )}

      {showQuickAdd && (
        <div className="trading-overlay" role="presentation" onClick={() => setShowQuickAdd(false)}>
          <section className="trading-sheet trading-quick-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-add-title" onClick={(event) => event.stopPropagation()}>
            <div className="trading-sheet-heading">
              <div><span className="trading-sheet-eyebrow">QUICK ACTIONS</span><h2 id="quick-add-title">Create new</h2></div>
              <button type="button" onClick={() => setShowQuickAdd(false)} aria-label="Close"><X size={21} /></button>
            </div>
            {[
              { label: "New Sale", Icon: ShoppingCart },
              { label: "Add Stock", Icon: Boxes },
              { label: "Add Product", Icon: Package },
              { label: "Record Expense", Icon: CircleDollarSign },
              { label: "New Customer", Icon: Users },
            ].map(({ label, Icon }) => (
              <button className="trading-quick-action" type="button" key={label} disabled>
                <Icon size={19} /><span>{label}</span><small>Setup pending</small>
              </button>
            ))}
            <p className="trading-sheet-note">These actions will be connected to their verified workflows after their module requirements are defined.</p>
          </section>
        </div>
      )}
    </main>
  );
}
