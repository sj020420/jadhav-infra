import React, { useState } from 'react';
import { useData } from '../DataContext.jsx';
import { METHODS, PAY_STATUS } from '../constants.js';
import { fmtDate, fyOf, today } from '../utils.js';
import { Field } from '../components/ui.jsx';
import { FormActions, num, useForm } from './FormKit.jsx';

const nextNumber = (invoices, date) => {
  const fy = fyOf(date);
  const max = invoices
    .filter((i) => i.number && i.number.startsWith(`JI/${fy}/`))
    .reduce((m, i) => Math.max(m, Number(i.number.split('/')[2]) || 0), 0);
  return `JI/${fy}/${String(max + 1).padStart(4, '0')}`;
};

export default function InvoiceForm({ initial, presetJob, onDone, onCancel }) {
  const { D, save, notify } = useData();
  const pj = presetJob ? D.jobs.find((j) => j.id === presetJob) : null;
  const edit = !!initial;

  // Selected customer for autofill helper (user can still freely edit any field)
  const [selectedCustId, setSelectedCustId] = useState(initial?.customerId || pj?.customerId || '');

  const start0 = edit
    ? {
        customerId: initial.customerId || '',
        customerName: initial.customer?.name || initial.customerName || '',
        customerMobile: initial.customer?.mobile || initial.mobile || '',
        customerAddress: initial.customer?.address || initial.address || '',
        customerGstin: initial.customer?.gstin || initial.gstin || '',
        number: initial.number || '',
        date: initial.date || today(),
        description: initial.work?.description || initial.description || 'JCB Excavation Work',
        location: initial.work?.location || initial.location || '',
        // Manual entry only - load exact saved values from API
        hours: initial.hours !== undefined && initial.hours !== null ? String(initial.hours) : initial.work?.hours !== undefined && initial.work?.hours !== null ? String(initial.work.hours) : '',
        price: initial.price !== undefined && initial.price !== null ? String(initial.price) : initial.work?.rate !== undefined && initial.work?.rate !== null ? String(initial.work.rate) : '',
        finalPrice: initial.finalPrice !== undefined && initial.finalPrice !== null ? String(initial.finalPrice) : initial.grandTotal !== undefined && initial.grandTotal !== null ? String(initial.grandTotal) : initial.work?.finalPrice !== undefined && initial.work?.finalPrice !== null ? String(initial.work.finalPrice) : initial.work?.amount !== undefined && initial.work?.amount !== null ? String(initial.work.amount) : '',
        paid: initial.paid !== undefined && initial.paid !== null ? String(initial.paid) : '0',
        pending: initial.pending !== undefined && initial.pending !== null ? String(initial.pending) : '',
        method: initial.method || 'Cash',
        status: initial.status || 'Unpaid',
        gst: !!initial.gstEnabled,
        gstRate: String(initial.gstRate || '18'),
        notes: initial.notes || '',
      }
    : {
        customerId: pj?.customerId || '',
        customerName: pj?.customerName || '',
        customerMobile: pj?.mobile || '',
        customerAddress: pj?.address || '',
        customerGstin: '',
        number: nextNumber(D.invoices, today()),
        date: today(),
        description: pj ? `${pj.workType} work (JCB)` : 'JCB Excavation Work',
        location: pj?.location || '',
        // Manual entry only - start empty so user explicitly types manual values
        hours: '',
        price: '',
        finalPrice: '',
        paid: '0',
        pending: '',
        method: 'Cash',
        status: 'Unpaid',
        gst: false,
        gstRate: '18',
        notes: '',
      };

  const F = useForm(
    start0,
    (v) => {
      const e = {};
      if (!v.customerName.trim()) e.customerName = 'Enter customer name';
      if (!v.number.trim()) e.number = 'Enter invoice number';
      if (!v.date) e.date = 'Select invoice date';
      if (!(num(v.hours) >= 0 && v.hours.trim() !== '')) e.hours = 'Enter valid hours (manual input)';
      if (!(num(v.price) >= 0 && v.price.trim() !== '')) e.price = 'Enter valid price (manual input)';
      if (!(num(v.finalPrice) >= 0 && v.finalPrice.trim() !== '')) e.finalPrice = 'Enter valid final price (manual input)';
      if (v.paid && !(num(v.paid) >= 0)) e.paid = 'Paid amount cannot be negative';
      if (v.pending && !(num(v.pending) >= 0)) e.pending = 'Pending amount cannot be negative';
      if (v.gst && !(num(v.gstRate) > 0)) e.gstRate = 'Enter GST %';
      return e;
    },
    async (v) => {
      const hoursVal = Number(v.hours);
      const priceVal = Number(v.price);
      // Final Price is 100% manually entered by the user (NO automatic Hours * Price calculation)
      const finalPriceVal = Number(v.finalPrice);
      const paidVal = v.paid.trim() !== '' ? Number(v.paid) : 0;
      const pendingVal = v.pending.trim() !== '' ? Number(v.pending) : Math.max(0, finalPriceVal - paidVal);

      const invData = {
        ...(edit && initial?.id ? { id: initial.id } : {}),
        number: v.number.trim(),
        date: v.date,
        jobId: edit ? initial.jobId : pj?.id || null,
        customerId: v.customerId || null,
        customer: {
          name: v.customerName.trim(),
          mobile: (v.customerMobile || '').trim(),
          address: (v.customerAddress || '').trim(),
          gstin: (v.customerGstin || '').trim().toUpperCase(),
        },
        work: {
          date: v.date,
          description: (v.description || 'JCB Work').trim(),
          location: (v.location || '').trim(),
          start: edit ? initial.work?.start || '-' : pj?.start || '-',
          end: edit ? initial.work?.end || '-' : pj?.end || '-',
          hours: hoursVal,
          rate: priceVal,
          finalPrice: finalPriceVal,
          amount: finalPriceVal,
        },
        // Root fields matching exact user inputs
        hours: hoursVal,
        price: priceVal,
        finalPrice: finalPriceVal,
        subtotal: finalPriceVal,
        grandTotal: finalPriceVal,
        paid: paidVal,
        pending: pendingVal,
        method: v.method || 'Cash',
        status: v.status || (paidVal >= finalPriceVal ? 'Paid' : paidVal > 0 ? 'Partial' : 'Unpaid'),
        gstEnabled: !!v.gst,
        gstRate: v.gst ? Number(v.gstRate) : 0,
        gstAmount: v.gst ? Math.round(((finalPriceVal * Number(v.gstRate)) / 100) * 100) / 100 : 0,
        notes: (v.notes || '').trim(),
      };

      const saved = await save('invoices', invData);
      notify(edit ? 'Invoice updated successfully' : 'Invoice generated successfully');
      if (onDone) onDone(saved);
    },
  );

  const { v, set, err, bind } = F;

  const onSelectCustomer = (e) => {
    const cid = e.target.value;
    setSelectedCustId(cid);
    set('customerId', cid);
    if (cid) {
      const c = D.customers.find((x) => x.id === cid);
      if (c) {
        set('customerName', c.name || '');
        set('customerMobile', c.mobile || '');
        set('customerAddress', c.address || '');
        set('customerGstin', c.gstin || '');
      }
    }
  };

  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <Field label="Choose Customer (or type details below)" full>
        <select value={selectedCustId} onChange={onSelectCustomer}>
          <option value="">-- Select from saved customers or enter below --</option>
          {D.customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.mobile ? `(${c.mobile})` : ''}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Customer Name *" err={err.customerName}>
        <input {...bind('customerName')} autoCapitalize="words" placeholder="e.g. Ramesh Patil" />
      </Field>

      <Field label="Customer Mobile">
        <input {...bind('customerMobile')} type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile" />
      </Field>

      <Field label="Customer Address" full>
        <input {...bind('customerAddress')} autoCapitalize="sentences" placeholder="Customer address / village" />
      </Field>

      <Field label="Customer GSTIN (optional)">
        <input {...bind('customerGstin')} autoCapitalize="characters" maxLength={15} placeholder="15-digit GSTIN" />
      </Field>

      <Field label="Invoice Number *" err={err.number}>
        <input {...bind('number')} placeholder="e.g. JI/2026-27/0001" />
      </Field>

      <Field label="Invoice Date *" err={err.date}>
        <input
          type="date"
          value={v.date}
          onChange={(e) => {
            set('date', e.target.value);
            if (!edit) set('number', nextNumber(D.invoices, e.target.value));
          }}
        />
      </Field>

      <Field label="Description of Work" full>
        <input {...bind('description')} placeholder="e.g. JCB Pipeline / Excavation Work" />
      </Field>

      <Field label="Site Location" full>
        <input {...bind('location')} autoCapitalize="words" placeholder="e.g. Malegaon MIDC" />
      </Field>

      {/* Manual Entry Section - NO automatic calculations */}
      <Field label="Hours * (Manual Input)" err={err.hours} hint="User manual entry">
        <input
          {...bind('hours')}
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          placeholder="Enter hours manually (e.g. 10)"
        />
      </Field>

      <Field label="Price (₹) * (Manual Input)" err={err.price} hint="User manual entry">
        <input
          {...bind('price')}
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          placeholder="Enter price manually (e.g. 1100)"
        />
      </Field>

      <Field
        label="Final Price (₹) * (Manual Input - Total Amount)"
        err={err.finalPrice}
        hint="User manual entry (not calculated from Price × Hours)"
        full
      >
        <input
          {...bind('finalPrice')}
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          placeholder="Enter final price manually (e.g. 11000)"
        />
      </Field>

      <Field label="Paid Amount (₹)">
        <input
          {...bind('paid')}
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          placeholder="Enter paid amount (e.g. 11000)"
        />
      </Field>

      <Field label="Pending Amount (₹)" hint="Leave blank to use (Final Price - Paid)">
        <input
          {...bind('pending')}
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          placeholder={
            v.finalPrice && v.paid
              ? `Auto: ${Math.max(0, Number(v.finalPrice) - Number(v.paid))}`
              : 'Enter pending amount'
          }
        />
      </Field>

      <Field label="Payment Method">
        <select {...bind('method')}>
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>

      <Field label="Payment Status">
        <select {...bind('status')}>
          {PAY_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <label className="check full">
        <input type="checkbox" checked={v.gst} onChange={(e) => set('gst', e.target.checked)} />
        Apply GST on this invoice
      </label>

      {v.gst && (
        <Field label="GST %" err={err.gstRate}>
          <input {...bind('gstRate')} type="number" min="0" step="any" />
        </Field>
      )}

      <Field label="Notes" full>
        <textarea rows={2} {...bind('notes')} placeholder="Optional invoice remarks" />
      </Field>

      <FormActions busy={F.busy} onCancel={onCancel} label={edit ? 'Update Invoice' : 'Save Invoice'} />
    </form>
  );
}

