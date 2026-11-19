import React from 'react';
import { useData } from '../DataContext.jsx';
import { DIESEL_PAYMENT_BY, METHODS } from '../constants.js';
import { getSettings, today } from '../utils.js';
import { Field } from '../components/ui.jsx';
import { FormActions, num, useForm } from './FormKit.jsx';

export default function DieselForm({ initial, onDone, onCancel }) {
  const { save, notify } = useData();
  const F = useForm(
    {
      date: today(),
      machine: getSettings().machine || 'JCB',
      litres: '',
      finalPrice: '',
      paymentBy: 'Ashish Jadhav',
      method: 'Cash',
      notes: '',
      ...(initial
        ? {
            ...initial,
            litres: String(initial.litres ?? ''),
            finalPrice: String(initial.finalPrice ?? initial.total ?? ''),
            paymentBy: initial.paymentBy || 'Ashish Jadhav',
          }
        : {}),
    },
    (v) => {
      const e = {};
      if (!v.date) e.date = 'Select the date';
      if (!(num(v.litres) > 0)) e.litres = 'Enter litres greater than 0';
      if (!(num(v.finalPrice) > 0)) e.finalPrice = 'Enter a valid final price';
      if (!v.paymentBy) e.paymentBy = 'Select who made the payment';
      return e;
    },
    async (v) => {
      const price = Number(v.finalPrice);
      await save('diesel', {
        ...(initial?.id ? { id: initial.id } : {}),
        ...v,
        litres: Number(v.litres),
        finalPrice: price,
        total: price, // synced for compatibility with existing total calculations
      });
      notify(initial ? 'Diesel entry updated' : 'Diesel entry saved');
      onDone();
    },
  );

  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <Field label="Date *" err={F.err.date}>
        <input type="date" {...F.bind('date')} />
      </Field>
      <Field label="JCB / Machine">
        <input {...F.bind('machine')} autoCapitalize="words" />
      </Field>
      <Field label="Litres *" err={F.err.litres}>
        <input {...F.bind('litres')} type="number" inputMode="decimal" min="0" step="any" placeholder="e.g. 50" />
      </Field>
      <Field label="Final Price (₹) *" err={F.err.finalPrice}>
        <input {...F.bind('finalPrice')} type="number" inputMode="decimal" min="0" step="any" placeholder="e.g. 4500" />
      </Field>
      <Field label="Payment By *" err={F.err.paymentBy}>
        <select {...F.bind('paymentBy')}>
          {DIESEL_PAYMENT_BY.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>
      <Field label="Payment Method">
        <select {...F.bind('method')}>
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>
      <Field label="Notes" full>
        <textarea rows={2} {...F.bind('notes')} placeholder="Optional notes" />
      </Field>
      <FormActions busy={F.busy} onCancel={onCancel} />
    </form>
  );
}
