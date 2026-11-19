import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../DataContext.jsx';
import { COMPANY } from '../constants.js';
import { fmtDate, fyOf, inr, round2, today } from '../utils.js';
import { invoicePdf } from '../export.js';
import Invoice from '../components/Invoice.jsx';
import DataTable from '../components/DataTable.jsx';
import { Confirm, EmptyState, Field, Modal, PageHeader } from '../components/ui.jsx';
import { FormActions, useForm } from '../forms/FormKit.jsx';

const nextNumber = (invoices, date) => {
  const fy = fyOf(date);
  const max = invoices.filter((i) => i.number.startsWith(`JI/${fy}/`)).reduce((m, i) => Math.max(m, Number(i.number.split('/')[2]) || 0), 0);
  return `JI/${fy}/${String(max + 1).padStart(4, '0')}`;
};
// Invoice always shows the job's live paid/pending
const live = (inv, D) => {
  const j = D.jobs.find((x) => x.id === inv.jobId);
  if (!j) return inv;
  const paid = j.paid;
  return { ...inv, paid, pending: Math.max(0, round2(inv.grandTotal - paid)), status: paid <= 0 ? 'Unpaid' : paid >= inv.grandTotal ? 'Paid' : 'Partial', method: j.method };
};

function InvoiceForm({ presetJob, onCancel }) {
  const { D, save, notify } = useData();
  const nav = useNavigate();
  const pj = D.jobs.find((j) => j.id === presetJob);
  const F = useForm(
    { customerId: pj?.customerId || '', jobId: pj?.id || '', date: today(), number: nextNumber(D.invoices, today()), description: pj ? `${pj.workType} work (JCB)` : '', gst: false, gstRate: '18', notes: '' },
    (v) => { const e = {}; if (!v.customerId) e.customerId = 'Select a customer'; if (!v.jobId) e.jobId = 'Select a JCB work record'; if (!v.number.trim()) e.number = 'Enter invoice number'; if (v.gst && !(Number(v.gstRate) > 0)) e.gstRate = 'Enter GST %'; return e; },
    async (v) => {
      const j = D.jobs.find((x) => x.id === v.jobId), c = D.customers.find((x) => x.id === v.customerId);
      const rate = v.gst ? Number(v.gstRate) : 0;
      const gstAmount = round2((j.total * rate) / 100), grand = round2(j.total + gstAmount);
      const igst = !!(c.gstin && !c.gstin.startsWith('27'));
      const inv = {
        number: v.number.trim(), date: v.date, jobId: j.id, notes: v.notes.trim(),
        customer: { name: c.name, mobile: c.mobile, address: c.address || '', gstin: c.gstin || '' },
        work: { date: j.date, description: v.description || `${j.workType} work (JCB)`, location: j.location, start: j.start, end: j.end, hours: j.hours, rate: j.rate, amount: j.total },
        gstEnabled: v.gst, gstRate: rate, igst, subtotal: j.total, gstAmount, grandTotal: grand,
        paid: j.paid, pending: Math.max(0, round2(grand - j.paid)), method: j.method, status: j.status,
      };
      const saved = await save('invoices', inv);
      notify('Invoice generated');
      nav(`/invoices/${saved.id}`);
    },
  );
  const { v, set, err } = F;
  const cjobs = D.jobs.filter((j) => j.customerId === v.customerId);
  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <Field label="Customer *" err={err.customerId} full><select value={v.customerId} onChange={(e) => { set('customerId', e.target.value); set('jobId', ''); }}><option value="">-- Select customer --</option>{D.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="JCB Work Record *" err={err.jobId} full>
        <select value={v.jobId} onChange={(e) => { const j = D.jobs.find((x) => x.id === e.target.value); set('jobId', e.target.value); if (j) set('description', `${j.workType} work (JCB)`); }}>
          <option value="">-- Select work --</option>{cjobs.map((j) => <option key={j.id} value={j.id}>{fmtDate(j.date)} · {j.workType} · {j.hours} hrs · {inr(j.total)}</option>)}
        </select>
      </Field>
      <Field label="Invoice Number *" err={err.number}><input {...F.bind('number')} /></Field>
      <Field label="Invoice Date"><input type="date" value={v.date} onChange={(e) => { set('date', e.target.value); set('number', nextNumber(D.invoices, e.target.value)); }} /></Field>
      <Field label="Description of Work" full><input {...F.bind('description')} /></Field>
      <label className="check full"><input type="checkbox" checked={v.gst} onChange={(e) => set('gst', e.target.checked)} /> Apply GST on this invoice</label>
      {v.gst && <Field label="GST %" err={err.gstRate}><input {...F.bind('gstRate')} type="number" min="0" step="any" /></Field>}
      <Field label="Notes" full><textarea rows={2} {...F.bind('notes')} /></Field>
      <FormActions busy={F.busy} onCancel={onCancel} label="Generate Invoice" />
    </form>
  );
}

export function InvoiceView() {
  const { id } = useParams();
  const { D } = useData();
  const nav = useNavigate();
  const raw = D.invoices.find((i) => i.id === id);
  if (!raw) return <div className="card"><EmptyState text="Invoice not found" /><button className="btn" onClick={() => nav('/invoices')}>← Back to invoices</button></div>;
  const inv = live(raw, D);
  return (
    <div>
      <div className="page-head no-print">
        <button className="btn ghost" onClick={() => nav('/invoices')}>← Back</button>
        <div className="head-actions"><button className="btn primary big" onClick={() => window.print()}>🖨 Print</button><button className="btn big" onClick={() => invoicePdf(inv)}>⬇ Download PDF</button></div>
      </div>
      <Invoice inv={inv} />
    </div>
  );
}

export default function Invoices() {
  const { D, remove, notify } = useData();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState(null);
  const preset = sp.get('job');
  useEffect(() => { if (preset) setOpen(true); }, [preset]);
  const cols = [
    { key: 'number', label: 'Invoice No' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'customer', label: 'Customer', val: (r) => r.customer.name },
    { key: 'grandTotal', label: 'Amount', type: 'money' }, { key: 'status', label: 'Status', badge: true, val: (r) => live(r, D).status },
  ];
  const close = () => { setOpen(false); setSp({}); };
  return (
    <div>
      <PageHeader title="Invoices"><button className="btn primary big" onClick={() => setOpen(true)}>+ Generate Invoice</button></PageHeader>
      <p className="note">Billing from <b>{COMPANY.name}</b>. GST is applied only when you tick it on an invoice.</p>
      <div className="card flush">
        <DataTable columns={cols} rows={D.invoices} empty='No invoices yet. Tap "+ Generate Invoice".'
          actions={(r) => (<><button className="btn sm" onClick={() => nav(`/invoices/${r.id}`)}>👁 View / Print</button><button className="btn sm danger-o" onClick={() => setDel(r)}>🗑 Delete</button></>)} />
      </div>
      {open && <Modal title="Generate Invoice" onClose={close}><InvoiceForm presetJob={preset} onCancel={close} /></Modal>}
      {del && <Confirm text={`Delete invoice ${del.number}? The JCB work record is not affected.`} onNo={() => setDel(null)} onYes={async () => { try { await remove('invoices', del.id); notify('Invoice deleted'); setDel(null); } catch (e) { notify(e.message, 'err'); } }} />}
    </div>
  );
}
