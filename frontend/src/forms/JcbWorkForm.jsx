import React, { useState } from 'react';
import { useData } from '../DataContext.jsx';
import { METHODS, PAY_STATUS, WORK_TYPES } from '../constants.js';
import { statusOf } from '../calc.js';
import { calcHours, crossesMidnight, fmt12, getLast, getSettings, inr, round2, setLast, today, validMobile } from '../utils.js';
import { Field } from '../components/ui.jsx';
import { FormActions, num, useForm } from './FormKit.jsx';

const calc = (v) => {
  const hours = calcHours(v.start, v.end);
  const calculatedTotal = round2(hours * (Number(v.rate) || 0));
  const hasFinalPrice = v.finalPrice !== undefined && v.finalPrice !== null && String(v.finalPrice).trim() !== '' && !isNaN(Number(v.finalPrice));
  const finalPrice = hasFinalPrice ? round2(Number(v.finalPrice)) : null;
  // Rule 1 & 2: Admin Final Price has highest priority.
  // Rule 4: Do not add original calculated price and Admin Final Price together.
  // Rule 5: If Admin Final Price is empty, continue using original calculated total.
  const total = finalPrice !== null ? finalPrice : calculatedTotal;
  const paid = round2(Number(v.paid) || 0);
  return { hours, calculatedTotal, finalPrice, hasFinalPrice, total, paid, pending: Math.max(0, round2(total - paid)) };
};

// Quick-entry form for one JCB job. Remembers last rate / work type / method.
export default function JcbWorkForm({ initial, onDone, onCancel }) {
  const { D, save, notify } = useData();
  const edit = !!initial;
  const multi = edit && (initial.payments || []).length > 1; // paid via several receipts -> edit in Payments page
  const last = getLast();
  const st = getSettings();
  const [saved, setSaved] = useState(null);

  const start0 = edit
    ? {
        customerId: initial.customerId || '',
        newName: '',
        newMobile: '',
        location: initial.location || '',
        workType: initial.workType,
        date: initial.date,
        start: initial.start,
        end: initial.end,
        rate: String(initial.rate ?? ''),
        finalPrice: initial.finalPrice !== undefined && initial.finalPrice !== null
          ? String(initial.finalPrice)
          : initial.calculatedTotal && initial.total && Number(initial.total) !== Number(initial.calculatedTotal)
            ? String(initial.total)
            : '',
        paid: String(initial.paid ?? 0),
        method: initial.method || 'Cash',
        status: initial.status,
        notes: initial.notes || '',
      }
    : {
        customerId: D.customers.length ? '' : '__new',
        newName: '',
        newMobile: '',
        location: '',
        workType: last.workType || 'Excavation',
        date: today(),
        start: '',
        end: '',
        rate: String(last.rate || st.rate || ''),
        finalPrice: '',
        paid: '0',
        method: last.method || 'Cash',
        status: 'Unpaid',
        notes: '',
      };

  const F = useForm(
    start0,
    (v) => {
      const e = {}; const c = calc(v);
      if (v.customerId === '__new') {
        if (v.newMobile && !validMobile(v.newMobile)) e.newMobile = 'Enter a valid 10-digit mobile number';
      }
      if (!v.date) e.date = 'Select the date';
      if (!v.start) e.start = 'Select start time';
      if (!v.end) e.end = 'Select end time';
      if (v.start && v.end && c.hours <= 0) e.end = 'End time cannot be the same as start time';
      if (!(num(v.rate) > 0)) e.rate = 'Enter a valid rate per hour';
      if (v.finalPrice !== undefined && String(v.finalPrice).trim() !== '') {
        if (isNaN(Number(v.finalPrice)) || Number(v.finalPrice) < 0) {
          e.finalPrice = 'Enter a valid final price (cannot be negative)';
        }
      }
      if (!(num(v.paid) >= 0)) e.paid = 'Paid amount cannot be negative';
      else if (c.paid > c.total) e.paid = `Paid amount cannot be more than final total (${inr(c.total)})`;
      return e;
    },
    async (v) => {
      let cid = v.customerId || null, cname = 'Cash / Walk-in', mobile = '';
      if (cid === '__new') {
        const name = v.newName.trim() || (v.newMobile?.trim() ? `Customer (${v.newMobile.trim()})` : 'Cash / Walk-in');
        const mob = (v.newMobile || '').trim();
        if (v.newName.trim() || mob) {
          const c = await save('customers', { name, mobile: mob, address: '', gstin: '', email: '', notes: '' });
          cid = c.id; cname = c.name; mobile = c.mobile;
        } else {
          cid = null; cname = 'Cash / Walk-in'; mobile = '';
        }
      } else if (cid) {
        const c = D.customers.find((x) => x.id === cid);
        cname = c ? c.name : 'Customer';
        mobile = c ? c.mobile : '';
      }
      const c = calc(v);
      const payments = multi ? initial.payments : c.paid > 0 ? [{ date: (initial?.payments?.[0]?.date) || v.date, amount: c.paid, method: v.method }] : [];
      const paid = multi ? initial.paid : c.paid;
      const job = {
        ...(edit ? { id: initial.id } : {}),
        customerId: cid, customerName: cname, mobile, location: v.location.trim(), workType: v.workType,
        date: v.date, start: v.start, end: v.end, hours: c.hours, rate: Number(v.rate),
        calculatedTotal: c.calculatedTotal,
        finalPrice: c.hasFinalPrice ? c.finalPrice : null,
        total: c.total,
        payments, paid, pending: Math.max(0, round2(c.total - paid)), status: statusOf(c.total, paid),
        method: v.method, notes: v.notes.trim(),
      };
      await save('jobs', job);
      setLast({ rate: job.rate, workType: job.workType, method: job.method });
      if (edit) { notify('JCB Work updated'); onDone(); } else setSaved({ ...job, customerName: cname });
    },
  );
  const { v, set, err } = F;
  const c = calc(v);
  const status = statusOf(c.total, c.paid);
  const selected = D.customers.find((x) => x.id === v.customerId);

  const onStatus = (s) => {
    if (s === 'Paid') { set('paid', String(c.total)); } else if (s === 'Unpaid') { set('paid', '0'); }
    set('status', s);
  };

  if (saved) {
    return (
      <div className="success">
        <div className="ok-ico">✅</div>
        <h2>JCB Work Saved Successfully</h2>
        <div className="kv">
          <span>Customer</span><b>{saved.customerName}</b>
          <span>Hours</span><b>{saved.hours}</b>
          <span>Rate</span><b>{inr(saved.rate)}/hr</b>
          <span>Original/Calculated Price</span><b>{inr(saved.calculatedTotal ?? saved.total)}</b>
          {saved.finalPrice !== null && saved.finalPrice !== undefined && (
            <><span>Admin Final Price</span><b>{inr(saved.finalPrice)}</b></>
          )}
          <span>Final Total</span><b>{inr(saved.total)}</b>
          <span>Payment Status</span><b><span className={`badge ${saved.status}`}>{saved.status}</span></b>
        </div>
        <div className="form-actions">
          <button className="btn ghost" onClick={onDone}>Close</button>
          <button className="btn primary big" onClick={() => { setSaved(null); F.setV({ ...start0, rate: String(saved.rate), workType: saved.workType, customerId: '', start: '', end: '', finalPrice: '', paid: '0', status: 'Unpaid', notes: '' }); }}>+ Add Another</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <Field label="Customer (optional)" err={err.customerId} full>
        <select {...F.bind('customerId')}>
          <option value="">-- Optional (Cash / Walk-in) --</option>
          {D.customers.map((x) => <option key={x.id} value={x.id}>{x.name} {x.mobile ? `(${x.mobile})` : ''}</option>)}
          {!edit && <option value="__new">+ Add new customer</option>}
        </select>
      </Field>
      {v.customerId === '__new' ? (
        <>
          <Field label="New Customer Name (optional)" err={err.newName}><input {...F.bind('newName')} placeholder="Optional name" /></Field>
          <Field label="Customer Mobile (optional)" err={err.newMobile}><input {...F.bind('newMobile')} inputMode="numeric" maxLength={10} placeholder="Optional mobile" /></Field>
        </>
      ) : selected && <Field label="Customer Mobile"><input value={selected.mobile || '-'} disabled /></Field>}

      <Field label="Site / Work Location"><input {...F.bind('location')} placeholder="e.g. Baramati MIDC" /></Field>
      <Field label="Work Type"><select {...F.bind('workType')}>{WORK_TYPES.map((w) => <option key={w}>{w}</option>)}</select></Field>
      <Field label="Date *" err={err.date}><input type="date" {...F.bind('date')} /></Field>
      <Field label="Rate Per Hour (₹) *" err={err.rate}><input {...F.bind('rate')} inputMode="decimal" type="number" min="0" step="any" /></Field>
      <Field label="JCB Start Time *" err={err.start}><input type="time" {...F.bind('start')} /></Field>
      <Field label="JCB End Time *" err={err.end}><input type="time" {...F.bind('end')} /></Field>

      <Field
        label="Admin Final Price (₹)"
        err={err.finalPrice}
        hint={c.hasFinalPrice ? `Overrides calculated price (${inr(c.calculatedTotal)})` : 'Optional – leave empty to use calculated price'}
        full
      >
        <input
          {...F.bind('finalPrice')}
          inputMode="decimal"
          type="number"
          min="0"
          step="any"
          placeholder={c.calculatedTotal > 0 ? `Calculated: ${c.calculatedTotal}` : 'Enter final price to override'}
        />
      </Field>

      <div className="calc-box full">
        <div className="calc-row">
          <div><span>Total Hours</span><b>{c.hours || 0} hrs</b></div>
          <div><span>Rate / Hr</span><b>{inr(v.rate || 0)}</b></div>
          <div><span>Original/Calculated Price</span><b>{inr(c.calculatedTotal)}</b></div>
          {c.hasFinalPrice && <div><span>Admin Final Price</span><b>{inr(c.finalPrice)}</b></div>}
        </div>

        <div className="final-price-banner">
          <div>
            <span className="banner-subtitle">Final Amount</span>
            <div className="banner-amount">{inr(c.total)}</div>
          </div>
          {c.hasFinalPrice && <span className="banner-pill">Admin Override</span>}
        </div>

        <div className="calc-row footer">
          <div>
            <span>Pending Balance</span>
            <b className={c.pending > 0 ? 'red' : 'green'}>{inr(Math.max(0, c.pending))}</b>
          </div>
          {v.start && v.end && (
            <small className="time-range-hint">
              ⏱️ {fmt12(v.start)} → {fmt12(v.end)}
              {crossesMidnight(v.start, v.end) ? ' (next day - crosses midnight)' : ''}
            </small>
          )}
        </div>
      </div>

      <Field label="Payment Status"><select value={multi ? status : v.status === status ? v.status : status} onChange={(e) => onStatus(e.target.value)} disabled={multi}>{PAY_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Payment Method"><select {...F.bind('method')} disabled={multi}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
      <Field label="Paid Amount (₹)" err={err.paid} hint={multi ? 'Several part-payments recorded' : ''}>
        <input {...F.bind('paid')} inputMode="decimal" type="number" min="0" step="any" disabled={multi} />
      </Field>
      <Field label="Notes" full><textarea rows={2} {...F.bind('notes')} /></Field>
      <FormActions busy={F.busy} onCancel={onCancel} label="Save JCB Work" />
    </form>
  );
}
