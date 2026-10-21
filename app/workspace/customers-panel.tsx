"use client";

import { useActionState, useState } from "react";
import { createCustomerAction, createMeasurementAction, type CustomerFormState } from "@/app/workspace/customer-actions";
import { ChevronRight, Plus, Search, Users } from "lucide-react";

const initialState: CustomerFormState = {};

export type CustomerRecord = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export type MeasurementRecord = { id: string; customer_id: string; label: string; measurement_values: Record<string, number>; unit: "inches" | "cm"; recorded_at: string; notes: string | null };

export function CustomersPanel({ businessId, initialCustomers, initialMeasurements }: { businessId: string; initialCustomers: CustomerRecord[]; initialMeasurements: MeasurementRecord[] }) {
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState);
  const [showForm, setShowForm] = useState(false);
  const [measurementCustomer, setMeasurementCustomer] = useState<string | null>(null);
  const [measurementState, measurementAction, measurementPending] = useActionState(createMeasurementAction, initialState);
  const [search, setSearch] = useState("");
  const filtered = initialCustomers.filter((customer) =>
    [customer.full_name, customer.phone ?? "", customer.email ?? ""].some((value) =>
      value.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    ),
  );

  return (
    <section className="dashboard-content dashboard-customers">
      <div className="dashboard-greeting">
        <div><p className="dashboard-eyebrow">CUSTOMER DIRECTORY</p><h1>Customers</h1><p>Keep customer contact details and prepare for measurement records.</p></div>
        <button className="dashboard-primary-button" type="button" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> {showForm ? "Close form" : "Add customer"}</button>
      </div>

      {showForm && (
        <form className="dashboard-customer-form" action={formAction}>
          <input type="hidden" name="business_id" value={businessId} />
          <h2>New customer</h2>
          <label>Full name<input name="full_name" required minLength={2} maxLength={120} placeholder="Customer full name" /></label>
          <div className="dashboard-form-two">
            <label>Phone number<input name="phone" maxLength={40} type="tel" placeholder="Phone number" /></label>
            <label>Email address<input name="email" maxLength={254} type="email" placeholder="name@example.com" /></label>
          </div>
          <label>Notes <textarea name="notes" rows={3} maxLength={2000} placeholder="Optional notes" /></label>
          {state.error && <p className="dashboard-form-error" role="alert">{state.error}</p>}
          {state.success && <p className="dashboard-form-success" role="status">{state.success}</p>}
          <button className="dashboard-primary-button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save customer"}</button>
        </form>
      )}

      <div className="dashboard-customer-toolbar">
        <label className="dashboard-customer-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" aria-label="Search customers" /></label>
        <span>{filtered.length} {filtered.length === 1 ? "customer" : "customers"}</span>
      </div>

      {filtered.length ? (
        <div className="dashboard-customer-list">
          {filtered.map((customer) => (
            <article className="dashboard-customer-row" key={customer.id}>
              <span className="dashboard-customer-avatar"><Users size={18} /></span>
              <div className="dashboard-customer-details"><strong>{customer.full_name}</strong><span>{customer.phone || customer.email || "No contact details added"}</span></div>
              <span className="dashboard-customer-date">{new Date(customer.created_at).toLocaleDateString()}</span>
              <button className="dashboard-customer-measure-button" type="button" onClick={() => setMeasurementCustomer((current) => current === customer.id ? null : customer.id)}>{measurementCustomer === customer.id ? "Close" : "Measurements"}</button>
              {measurementCustomer === customer.id && <div className="dashboard-measurement-area"><form className="dashboard-customer-form" action={measurementAction}><h2>New measurement set</h2><input type="hidden" name="customer_id" value={customer.id} /><label>Set name<input name="label" required minLength={2} maxLength={100} placeholder="e.g. October fitting" /></label><label>Unit<select name="unit" defaultValue="inches"><option value="inches">Inches</option><option value="cm">Centimetres</option></select></label><div className="dashboard-form-two">{(["chest", "waist", "hip", "shoulder", "sleeve", "length"] as const).map((field) => <label key={field}>{field.charAt(0).toUpperCase() + field.slice(1)}<input name={field} type="number" min="0.1" max="1000" step="0.1" placeholder="Optional" /></label>)}</div><label>Notes<textarea name="measurement_notes" rows={2} maxLength={2000} placeholder="Optional fitting notes" /></label>{measurementState.error && <p className="dashboard-form-error" role="alert">{measurementState.error}</p>}{measurementState.success && <p className="dashboard-form-success" role="status">{measurementState.success}</p>}<button className="dashboard-primary-button" type="submit" disabled={measurementPending}>{measurementPending ? "Saving…" : "Save measurements"}</button></form><div className="dashboard-measurement-history"><h3>Saved measurement sets</h3>{initialMeasurements.filter((record) => record.customer_id === customer.id).length ? initialMeasurements.filter((record) => record.customer_id === customer.id).map((record) => <div className="dashboard-measurement-record" key={record.id}><strong>{record.label}</strong><span>{Object.entries(record.measurement_values).map(([key, value]) => `${key}: ${value} ${record.unit}`).join(" · ")}</span><small>{new Date(record.recorded_at).toLocaleDateString()}</small></div>) : <p>No measurements saved yet.</p>}</div></div>}
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-customer-empty"><span className="dashboard-empty-icon"><Users size={23} /></span><h2>{search ? "No matching customers" : "No customers yet"}</h2><p>{search ? "Try another name, phone number or email." : "Add your first customer to start building the business directory."}</p></div>
      )}
      <p className="dashboard-integrity-note">Customer records are private to authorized members of this business. Measurement records are the next connected feature.</p>
    </section>
  );
}
