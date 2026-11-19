import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../DataContext.jsx';
import { byCustomer } from '../calc.js';
import { inr } from '../utils.js';
import CrudPage from '../components/CrudPage.jsx';
import CustomerForm from '../forms/CustomerForm.jsx';

const cols = [
  { key: 'name', label: 'Customer' }, { key: 'mobile', label: 'Mobile' }, { key: 'address', label: 'Address' },
  { key: 'gstin', label: 'GSTIN' }, { key: 'email', label: 'Email' }, { key: 'jobs', label: 'Total Jobs' },
  { key: 'hours', label: 'Total Hours' }, { key: 'total', label: 'Total Billing', type: 'money' },
  { key: 'paid', label: 'Total Paid', type: 'money' }, { key: 'pending', label: 'Total Pending', type: 'money' },
];

export default function Customers() {
  const { D } = useData();
  const nav = useNavigate();
  const stats = Object.fromEntries(byCustomer(D.jobs).map((s) => [s.customerId, s]));
  const rows = D.customers.map((c) => ({ ...c, jobs: stats[c.id]?.jobs || 0, hours: stats[c.id]?.hours || 0, total: stats[c.id]?.total || 0, paid: stats[c.id]?.paid || 0, pending: stats[c.id]?.pending || 0 }));
  return (
    <CrudPage
      title="Customers" collection="customers" rows={rows} columns={cols} Form={CustomerForm} addLabel="+ Add New Customer"
      noDate defaultSort={{ key: 'name', dir: 'asc' }}
      beforeDelete={(r) => (r.jobs ? `${r.name} has ${r.jobs} job(s). Delete those jobs first.` : null)}
      summary={(r) => [['Customers', r.length], ['Total Billing', inr(r.reduce((s, c) => s + c.total, 0)), 'green'], ['Total Pending', inr(r.reduce((s, c) => s + c.pending, 0)), 'red']]}
      extraActions={(r) => <button className="btn sm" onClick={() => nav(`/reports?r=statement&c=${r.id}`)}>📋 Statement</button>}
    />
  );
}
