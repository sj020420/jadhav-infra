import React from 'react';
import { useData } from '../DataContext.jsx';
import { validMobile } from '../utils.js';
import { Field } from '../components/ui.jsx';
import { FormActions, useForm } from './FormKit.jsx';

export default function CustomerForm({ initial, onDone, onCancel }) {
  const { save, notify } = useData();
  const F = useForm(
    { name: '', mobile: '', address: '', gstin: '', email: '', notes: '', ...(initial || {}) },
    (v) => {
      const e = {};
      if (!v.name.trim() && !v.mobile.trim()) e.name = 'Enter customer name or mobile number';
      if (v.mobile && !validMobile(v.mobile)) e.mobile = 'Enter a valid 10-digit mobile number';
      if (v.gstin && !/^[0-9A-Z]{15}$/i.test(v.gstin.trim())) e.gstin = 'GSTIN must be 15 characters';
      if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Enter a valid email';
      return e;
    },
    async (v) => {
      const { jobs, hours, total, paid, pending, ...rest } = v; // strip computed fields
      const name = v.name.trim() || (v.mobile.trim() ? `Customer (${v.mobile.trim()})` : 'Customer');
      await save('customers', { ...rest, name, mobile: v.mobile.trim(), gstin: (v.gstin || '').trim().toUpperCase() });
      notify(initial ? 'Customer updated' : 'Customer added');
      onDone();
    },
  );
  return (
    <form onSubmit={F.submit} className="form" noValidate>
      <Field label="Customer Name (optional)" err={F.err.name}><input {...F.bind('name')} autoCapitalize="words" autoComplete="name" placeholder="Optional (e.g. Ramesh Patil)" /></Field>
      <Field label="Mobile *" err={F.err.mobile}><input {...F.bind('mobile')} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" placeholder="10-digit mobile number" /></Field>
      <Field label="Address" full><input {...F.bind('address')} autoCapitalize="sentences" placeholder="e.g. Village, Tehsil" /></Field>
      <Field label="GSTIN (optional)" err={F.err.gstin}><input {...F.bind('gstin')} autoCapitalize="characters" maxLength={15} placeholder="15-character GSTIN" /></Field>
      <Field label="Email (optional)" err={F.err.email}><input {...F.bind('email')} type="email" inputMode="email" autoComplete="email" placeholder="name@example.com" /></Field>
      <Field label="Notes" full><textarea rows={2} {...F.bind('notes')} placeholder="Optional notes" /></Field>
      <FormActions busy={F.busy} onCancel={onCancel} />
    </form>
  );
}
