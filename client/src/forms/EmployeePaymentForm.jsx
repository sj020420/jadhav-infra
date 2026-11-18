import React from 'react';
import { useData } from '../DataContext.jsx';
import { EMP_METHODS, PERSON_TYPES } from '../constants.js';
import { today } from '../utils.js';
import { Field } from '../components/ui.jsx';
import { FormActions, num, useForm } from './FormKit.jsx';

export default function EmployeePaymentForm({ initial, onDone, onCancel }) {
  const { D, save, notify } = useData();
  const names = [...new Set(D.employee_payments.map((p) => p.name))];
  const F = useForm(
    { date: today(), name: '', personType: 'Driver', reason: '', amount: '', method: 'Cash', status: 'Paid', notes: '', ...(initial ? { ...initial, amount: String(initial.amount) } : {}) },
    (v) => {
      const e = {};
      if (!v.date) e.date = 'Select the date';
      if (!v.name.trim()) e.name = 'Enter person name';
      if (!(num(v.amount) > 0)) e.amount = 'Enter an amount greater than 0';
      return e;
    },
    async (v) => {
      await save('employee_payments', { ...v, name: v.name.trim(), amount: Number(v.amount) });
      notify(initial ? 'Payment updated' : 'Payment saved');
      onDone();
    },
  );
  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <Field label="Date *" err={F.err.date}><input type="date" {...F.bind('date')} /></Field>
      <Field label="Person Name *" err={F.err.name}><input {...F.bind('name')} list="emp-names" /><datalist id="emp-names">{names.map((n) => <option key={n} value={n} />)}</datalist></Field>
      <Field label="Person Type"><select {...F.bind('personType')}>{PERSON_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Work / Reason"><input {...F.bind('reason')} placeholder="e.g. Daily wage, Salary" /></Field>
      <Field label="Amount (₹) *" err={F.err.amount}><input {...F.bind('amount')} type="number" inputMode="decimal" min="0" step="any" /></Field>
      <Field label="Payment Method"><select {...F.bind('method')}>{EMP_METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
      <Field label="Payment Status"><select {...F.bind('status')}><option>Paid</option><option>Pending</option></select></Field>
      <Field label="Notes" full><textarea rows={2} {...F.bind('notes')} /></Field>
      <FormActions busy={F.busy} onCancel={onCancel} />
    </form>
  );
}
