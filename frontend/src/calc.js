// ===== Business calculations =====
import { round2 } from './utils.js';

export const sum = (a, f) => round2(a.reduce((s, x) => s + Number(f(x) || 0), 0));
export const paidOf = (j) => sum(j.payments || [], (p) => p.amount);
export const statusOf = (total, paid) => (paid <= 0 ? 'Unpaid' : paid >= total ? 'Paid' : 'Partial');
export const enrichJob = (j) => {
  const paid = paidOf(j);
  const total = j.finalPrice !== null && j.finalPrice !== undefined && String(j.finalPrice).trim() !== '' && !isNaN(Number(j.finalPrice))
    ? round2(Number(j.finalPrice))
    : Number(j.total) || 0;
  const pending = Math.max(0, round2(total - paid));
  return { ...j, total, paid, pending, status: statusOf(total, paid) };
};

// Every money going out, in one list (manual expenses + diesel + paid driver/employee payments)
export const unified = (d) => [
  ...d.expenses.map((e) => ({ ...e, source: 'expenses' })),
  ...d.diesel.map((x) => ({
    id: x.id, date: x.date, type: 'Diesel', source: 'diesel',
    description: `${x.machine || 'JCB'} - ${x.litres} L @ Rs.${x.rate}/L`,
    amount: x.total, method: x.method, paidTo: x.supplier, notes: x.notes,
  })),
  ...d.employee_payments.filter((p) => p.status === 'Paid').map((p) => ({
    id: p.id, date: p.date, source: 'employee_payments',
    type: p.personType === 'Driver' ? 'Driver Salary' : 'Employee Salary',
    description: p.reason, amount: p.amount, method: p.method, paidTo: p.name, notes: p.notes,
  })),
];

export const catOf = (type) => {
  if (type === 'Diesel') return 'Diesel';
  if (type === 'Driver Salary') return 'Driver';
  if (type === 'Employee Salary') return 'Employee';
  if (type === 'Repairs') return 'Repair';
  if (type === 'Maintenance' || type === 'Spare Parts') return 'Maintenance';
  return 'Other';
};

export const byCustomer = (jobs) => {
  const m = {};
  jobs.forEach((j) => {
    const key = j.customerId || j.customerName || 'Cash / Walk-in';
    const o = m[key] || (m[key] = { customerId: j.customerId || '', customerName: j.customerName || 'Cash / Walk-in', mobile: j.mobile || '-', jobs: 0, hours: 0, total: 0, paid: 0, pending: 0 });
    o.jobs++; o.hours += j.hours; o.total += j.total; o.paid += j.paid; o.pending += j.pending;
  });
  return Object.values(m).map((o) => ({ ...o, hours: round2(o.hours), total: round2(o.total), paid: round2(o.paid), pending: round2(o.pending), status: statusOf(o.total, o.paid) }));
};
