import React from 'react';
import { useData } from '../DataContext.jsx';
import { EXPENSE_TYPES, METHODS } from '../constants.js';
import { today } from '../utils.js';
import { Field } from '../components/ui.jsx';
import { FormActions, num, useForm } from './FormKit.jsx';

export default function ExpenseForm({ initial, onDone, onCancel }) {
  const { save, notify } = useData();
  const F = useForm(
    { date: today(), type: 'Diesel', description: '', amount: '', method: 'Cash', paidTo: '', notes: '', ...(initial ? { ...initial, amount: String(initial.amount) } : {}) },
    (v) => {
      const e = {};
      if (!v.date) e.date = 'Select the date';
      if (!(num(v.amount) > 0)) e.amount = 'Enter an amount greater than 0';
      return e;
    },
    async (v) => {
      const { source, ...rest } = v;
      await save('expenses', { ...rest, amount: Number(v.amount) });
      notify(initial ? 'Expense updated' : 'Expense saved');
      onDone();
    },
  );
  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <Field label="Date *" err={F.err.date}><input type="date" {...F.bind('date')} /></Field>
      <Field label="Expense Type"><select {...F.bind('type')}>{EXPENSE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Description" full><input {...F.bind('description')} placeholder="e.g. JCB Diesel" /></Field>
      <Field label="Amount (₹) *" err={F.err.amount}><input {...F.bind('amount')} type="number" inputMode="decimal" min="0" step="any" /></Field>
      <Field label="Payment Method"><select {...F.bind('method')}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
      <Field label="Paid To"><input {...F.bind('paidTo')} /></Field>
      <Field label="Notes" full><textarea rows={2} {...F.bind('notes')} /></Field>
      <FormActions busy={F.busy} onCancel={onCancel} />
    </form>
  );
}
