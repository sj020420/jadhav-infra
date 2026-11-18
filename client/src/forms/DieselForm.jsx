import React from 'react';
import { useData } from '../DataContext.jsx';
import { METHODS } from '../constants.js';
import { getSettings, inr, round2, today } from '../utils.js';
import { Field } from '../components/ui.jsx';
import { FormActions, num, useForm } from './FormKit.jsx';

export default function DieselForm({ initial, onDone, onCancel }) {
  const { save, notify } = useData();
  const F = useForm(
    { date: today(), machine: getSettings().machine || 'JCB', litres: '', rate: '', supplier: '', method: 'Cash', notes: '', ...(initial ? { ...initial, litres: String(initial.litres), rate: String(initial.rate) } : {}) },
    (v) => {
      const e = {};
      if (!v.date) e.date = 'Select the date';
      if (!(num(v.litres) > 0)) e.litres = 'Enter litres greater than 0';
      if (!(num(v.rate) > 0)) e.rate = 'Enter a valid rate per litre';
      return e;
    },
    async (v) => {
      await save('diesel', { ...v, litres: Number(v.litres), rate: Number(v.rate), total: round2(Number(v.litres) * Number(v.rate)) });
      notify(initial ? 'Diesel entry updated' : 'Diesel entry saved');
      onDone();
    },
  );
  const total = round2((Number(F.v.litres) || 0) * (Number(F.v.rate) || 0));
  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <Field label="Date *" err={F.err.date}><input type="date" {...F.bind('date')} /></Field>
      <Field label="JCB / Machine"><input {...F.bind('machine')} /></Field>
      <Field label="Litres *" err={F.err.litres}><input {...F.bind('litres')} type="number" inputMode="decimal" min="0" step="any" /></Field>
      <Field label="Rate per Litre (₹) *" err={F.err.rate}><input {...F.bind('rate')} type="number" inputMode="decimal" min="0" step="any" /></Field>
      <div className="calc-box full"><div><span>Total Diesel Cost</span><b>{inr(total)}</b></div></div>
      <Field label="Petrol Pump / Supplier"><input {...F.bind('supplier')} /></Field>
      <Field label="Payment Method"><select {...F.bind('method')}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
      <Field label="Notes" full><textarea rows={2} {...F.bind('notes')} /></Field>
      <FormActions busy={F.busy} onCancel={onCancel} />
    </form>
  );
}
