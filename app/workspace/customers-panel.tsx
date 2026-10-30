"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { createCustomerAction, createMeasurementAction, type CustomerFormState } from "@/app/workspace/customer-actions";
import { Camera, Plus, Search, Users } from "lucide-react";

const initialState: CustomerFormState = {};
export type CustomerRecord = {
  id: string; full_name: string; phone: string | null; email: string | null; created_at: string;
  customer_photo_url: string | null; garment_photo_url: string | null;
};
export type MeasurementRecord = { id: string; customer_id: string; label: string; measurement_values: Record<string, number>; unit: "inches" | "cm"; recorded_at: string; notes: string | null };

export function CustomersPanel({ businessId, initialCustomers, initialMeasurements, language = "ha" }: {
  businessId: string; initialCustomers: CustomerRecord[]; initialMeasurements: MeasurementRecord[]; language?: "ha" | "en";
}) {
  const ha = language === "ha";
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState);
  const [showForm, setShowForm] = useState(false);
  const [measurementCustomer, setMeasurementCustomer] = useState<string | null>(null);
  const [measurementState, measurementAction, measurementPending] = useActionState(createMeasurementAction, initialState);
  const [search, setSearch] = useState("");
  const filtered = initialCustomers.filter(customer =>
    [customer.full_name, customer.phone ?? "", customer.email ?? ""].some(value => value.toLocaleLowerCase().includes(search.toLocaleLowerCase())),
  );
  return <section className="dashboard-content dashboard-customers">
    <div className="dashboard-greeting"><div><p className="dashboard-eyebrow">{ha ? "JERIN KWASTOMOMI" : "CUSTOMER DIRECTORY"}</p><h1>{ha ? "Kwastomomi" : "Customers"}</h1><p>{ha ? "Ajiye bayanan tuntuɓa da hotunan kwastomomi da kayansu." : "Keep contact details and photos of customers and their garments."}</p></div>
      <button className="dashboard-primary-button" type="button" onClick={() => setShowForm(v => !v)}><Plus size={16}/>{showForm ? (ha ? "Rufe fom" : "Close form") : (ha ? "Ƙara kwastoma" : "Add customer")}</button>
    </div>
    {showForm && <form className="dashboard-customer-form" action={formAction} encType="multipart/form-data">
      <input type="hidden" name="business_id" value={businessId}/><h2>{ha ? "Sabon kwastoma" : "New customer"}</h2>
      <label>{ha ? "Cikakken suna" : "Full name"}<input name="full_name" required minLength={2} maxLength={120} placeholder={ha ? "Cikakken sunan kwastoma" : "Customer full name"}/></label>
      <div className="dashboard-form-two"><label>{ha ? "Lambar waya" : "Phone number"}<input name="phone" maxLength={40} type="tel" placeholder={ha ? "Lambar waya" : "Phone number"}/></label>
        <label>{ha ? "Adireshin imel" : "Email address"}<input name="email" maxLength={254} type="email" placeholder="name@example.com"/></label></div>
      <label>{ha ? "Hoton kwastoma" : "Customer photo"}<span className="dashboard-photo-input"><Camera size={18}/><input name="customer_photo" type="file" accept="image/jpeg,image/png,image/webp" capture="user"/><small>{ha ? "Ɗauki hoto ko zaɓi daga Gallery (JPG, PNG, WebP; max 5 MB)" : "Take a photo or choose from Gallery (JPG, PNG, WebP; max 5 MB)"}</small></span></label>
      <label>{ha ? "Hoton kayan da za a ɗinka" : "Garment photo"}<span className="dashboard-photo-input"><Camera size={18}/><input name="garment_photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"/><small>{ha ? "Hoton kaya ko salon da kwastoma ya zaɓa" : "Photo of the garment or selected design"}</small></span></label>
      <label>{ha ? "Ƙarin bayani" : "Notes"}<textarea name="notes" rows={3} maxLength={2000} placeholder={ha ? "Ƙarin bayanai (na zaɓi)" : "Optional notes"}/></label>
      {state.error&&<p className="dashboard-form-error" role="alert">{state.error}</p>}{state.success&&<p className="dashboard-form-success" role="status">{state.success}</p>}
      <button className="dashboard-primary-button" type="submit" disabled={pending}>{pending ? (ha ? "Ana ajiyewa…" : "Saving…") : (ha ? "Ajiye kwastoma" : "Save customer")}</button>
    </form>}
    <div className="dashboard-customer-toolbar"><label className="dashboard-customer-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={ha ? "Nemo kwastoma" : "Search customers"} aria-label={ha ? "Nemo kwastoma" : "Search customers"}/></label><span>{filtered.length} {ha ? "kwastoma" : filtered.length===1 ? "customer" : "customers"}</span></div>
    {filtered.length ? <div className="dashboard-customer-list">{filtered.map(customer=><article className="dashboard-customer-row" key={customer.id}>
      <span className="dashboard-customer-avatar"><Users size={18}/></span><div className="dashboard-customer-details"><strong>{customer.full_name}</strong><span>{customer.phone||customer.email||(ha?"Ba a saka bayanin tuntuɓa ba":"No contact details added")}</span></div>
      <span className="dashboard-customer-date">{new Date(customer.created_at).toLocaleDateString(ha?"ha-NG":"en-NG")}</span>
      <button className="dashboard-customer-measure-button" type="button" onClick={()=>setMeasurementCustomer(v=>v===customer.id?null:customer.id)}>{measurementCustomer===customer.id?(ha?"Rufe":"Close"):(ha?"Ma'auni":"Measurements")}</button>
      {measurementCustomer===customer.id&&<div className="dashboard-measurement-area">
        <div className="dashboard-customer-photos">{customer.customer_photo_url&&<figure><Image src={customer.customer_photo_url} alt={ha?"Hoton kwastoma":"Customer photo"} width={240} height={240} unoptimized/><figcaption>{ha?"Hoton kwastoma":"Customer photo"}</figcaption></figure>}{customer.garment_photo_url&&<figure><Image src={customer.garment_photo_url} alt={ha?"Hoton kaya":"Garment photo"} width={240} height={240} unoptimized/><figcaption>{ha?"Hoton kaya":"Garment photo"}</figcaption></figure>}</div>
        <form className="dashboard-customer-form" action={measurementAction}><h2>{ha?"Sabon ma'auni":"New measurement set"}</h2><input type="hidden" name="customer_id" value={customer.id}/>
          <label>{ha?"Sunan ma'auni":"Set name"}<input name="label" required minLength={2} maxLength={100} placeholder={ha?"Misali: Ma'aunin farko":"e.g. First fitting"}/></label>
          <label>{ha?"Nau'in ma'auni":"Unit"}<select name="unit" defaultValue="inches"><option value="inches">{ha?"Inci":"Inches"}</option><option value="cm">{ha?"Santimita":"Centimetres"}</option></select></label>
          <div className="dashboard-form-two">{(["chest","waist","hip","shoulder","sleeve","length"] as const).map(field=><label key={field}>{({chest:ha?"Kirji":"Chest",waist:ha?"Kugu":"Waist",hip:ha?"Ƙugu":"Hip",shoulder:ha?"Faɗin kafaɗa":"Shoulder",sleeve:ha?"Hannun riga":"Sleeve",length:ha?"Tsawo":"Length"})[field]}<input name={field} type="number" min="0.1" max="1000" step="0.1" placeholder={ha?"Na zaɓi":"Optional"}/></label>)}</div>
          <label>{ha?"Ƙarin bayani":"Notes"}<textarea name="measurement_notes" rows={2} maxLength={2000}/></label>
          {measurementState.error&&<p className="dashboard-form-error" role="alert">{measurementState.error}</p>}{measurementState.success&&<p className="dashboard-form-success" role="status">{measurementState.success}</p>}
          <button className="dashboard-primary-button" type="submit" disabled={measurementPending}>{measurementPending?(ha?"Ana ajiyewa…":"Saving…"):(ha?"Ajiye ma'auni":"Save measurements")}</button>
        </form>
        <div className="dashboard-measurement-history"><h3>{ha?"Tsoffin ma'aunai":"Saved measurement sets"}</h3>{initialMeasurements.filter(r=>r.customer_id===customer.id).length?initialMeasurements.filter(r=>r.customer_id===customer.id).map(record=><div className="dashboard-measurement-record" key={record.id}><strong>{record.label}</strong><span>{Object.entries(record.measurement_values).map(([key,value])=>`${key}: ${value} ${record.unit}`).join(" · ")}</span><small>{new Date(record.recorded_at).toLocaleDateString(ha?"ha-NG":"en-NG")}</small></div>):<p>{ha?"Ba a ajiye ma'auni ba tukuna.":"No measurements saved yet."}</p>}</div>
      </div>}
    </article>)}</div>:<div className="dashboard-customer-empty"><span className="dashboard-empty-icon"><Users size={23}/></span><h2>{search?(ha?"Ba a sami kwastoman ba":"No matching customers"):(ha?"Babu kwastoma tukuna":"No customers yet")}</h2><p>{search?(ha?"Gwada wani suna ko lambar waya.":"Try another name or phone number."):(ha?"Ƙara kwastoma na farko domin fara rajistar kasuwancinka.":"Add your first customer to start your business directory.")}</p></div>}
    <p className="dashboard-integrity-note">{ha?"Bayanan kwastomomi da hotuna na sirri ne, kuma mambobin kasuwancin da aka ba izini kaɗai za su iya gani.":"Customer records and photos are private to authorized business members."}</p>
  </section>;
}
