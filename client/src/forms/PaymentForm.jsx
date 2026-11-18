import React from 'react';
import { useData } from '../DataContext.jsx';
import { METHODS } from '../constants.js';
import { statusOf } from '../calc.js';
import { fmtDate, inr, round2, today } from '../utils.js';
import { Field } from '../components/ui.jsx';
import { FormActions, num, useForm } from './FormKit.jsx';

// Receive a (part) payment against one JCB job
export default function PaymentForm({ job, onDone, onCancel }) {
  const { save, notify } = useData();
  const F = useForm(
    { date: today(), amount: String(job.pending), method: 'Cash' },
    (v) => {
      const e = {};
      if (!v.date) e.date = 'Select the date';
      if (!(num(v.amount) > 0)) e.amount = 'Enter an amount greater than 0';
      else if (Number(v.amount) > job.pending) e.amount = `Cannot be more than pending ${inr(job.pending)}`;
      return e;
    },
    async (v) => {
      const payments = [...(job.payments || []), { date: v.date, amount: Number(v.amount), method: v.method }];
      const paid = round2(payments.reduce((s, p) => s + p.amount, 0));
      await save('jobs', { ...job, payments, paid, pending: Math.max(0, round2(job.total - paid)), status: statusOf(job.total, paid), method: v.method });
      notify('Payment received');
      onDone();
    },
  );
  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <div className="calc-box full">
        <div><span>{job.customerName} · {fmtDate(job.date)}</span><b>Pending {inr(job.pending)}</b></div>
      </div>
      <Field label="Payment Date *" err={F.err.date}><input type="date" {...F.bind('date')} /></Field>
      <Field label="Amount Received (₹) *" err={F.err.amount}><input {...F.bind('amount')} type="number" inputMode="decimal" min="0" step="any" /></Field>
      <Field label="Payment Method"><select {...F.bind('method')}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
      <FormActions busy={F.busy} onCancel={onCancel} label="Save Payment" />
    </form>
  );
}
