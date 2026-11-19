import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../DataContext.jsx';
import { byCustomer, catOf, sum, unified } from '../calc.js';
import { CATS } from '../constants.js';
import { customerSummaryCols, dieselCols, empCols, expenseCols, jobCols, statementCols } from '../columns.js';
import { cellVal, fmtDate, inRange, inr, rangeText, round2, today } from '../utils.js';
import { exportExcel, exportPdf } from '../export.js';
import DataTable from '../components/DataTable.jsx';
import ReportTable from '../components/ReportTable.jsx';
import { DateRangeFilter, EmptyState, PageHeader, PrintHead, SummaryCard } from '../components/ui.jsx';

const TYPES = [
  ['daily', 'Daily Report'], ['weekly', 'Weekly Report'], ['monthly', 'Monthly Report'], ['customer', 'Customer Report'],
  ['jobs', 'JCB Work Report'], ['payments', 'Payment Report'], ['diesel', 'Diesel Report'], ['employees', 'Driver/Employee Report'],
  ['expenses', 'Expense Report'], ['pnl', 'Profit & Loss'], ['statement', 'Customer Statement'],
];
const defaultPreset = { daily: 'today', weekly: 'week', monthly: 'month', statement: 'all' };

function build(key, D, r, cid) {
  const jobs = D.jobs.filter((j) => inRange(j.date, r));
  const ex = unified(D).filter((e) => inRange(e.date, r));
  const income = sum(jobs, (j) => j.total), spent = sum(ex, (e) => e.amount);
  const cat = (c) => sum(ex.filter((e) => catOf(e.type) === c), (e) => e.amount);
  const money = (l, v) => [l, inr(v)];
  const mixed = [
    ['Jobs', jobs.length], ['Total Hours', sum(jobs, (j) => j.hours)], money('Total JCB Income', income), money('Paid', sum(jobs, (j) => j.paid)),
    money('Pending', sum(jobs, (j) => j.pending)), money('Total Expenses', spent), money('Net Profit', income - spent),
  ];
  switch (key) {
    case 'daily': case 'weekly': case 'monthly':
      return { title: TYPES.find((t) => t[0] === key)[1], summary: mixed, sections: [{ title: 'JCB Work', columns: jobCols, rows: jobs }, { title: 'Expenses', columns: expenseCols, rows: ex }] };
    case 'customer':
      return { title: 'Customer Report', summary: [money('Total Billing', income), money('Total Paid', sum(jobs, (j) => j.paid)), money('Total Pending', sum(jobs, (j) => j.pending))], sections: [{ title: 'Customers', columns: customerSummaryCols, rows: byCustomer(jobs) }] };
    case 'jobs':
      return { title: 'JCB Work Report', summary: mixed.slice(0, 5), sections: [{ title: 'JCB Work', columns: jobCols, rows: jobs }] };
    case 'payments': {
      const rec = (m) => sum(jobs.flatMap((j) => (j.payments || []).filter((p) => p.method === m)), (p) => p.amount);
      return {
        title: 'Payment Report',
        summary: [money('Total Billing', income), money('Total Paid', sum(jobs, (j) => j.paid)), money('Total Pending', sum(jobs, (j) => j.pending)), ...['Cash', 'UPI', 'Bank Transfer', 'Card'].map((m) => money(`${m} Received`, rec(m)))],
        sections: [{ title: 'Customer-wise Payments', columns: customerSummaryCols, rows: byCustomer(jobs) }],
      };
    }
    case 'diesel': {
      const d = D.diesel.filter((x) => inRange(x.date, r)); const l = sum(d, (x) => x.litres), c = sum(d, (x) => x.finalPrice ?? x.total);
      return { title: 'Diesel Report', summary: [['Total Litres', `${l} L`], money('Total Diesel Cost', c), money('Average Cost / Entry', d.length ? c / d.length : 0)], sections: [{ title: 'Diesel', columns: dieselCols, rows: d }] };
    }
    case 'employees': {
      const p = D.employee_payments.filter((x) => inRange(x.date, r));
      return { title: 'Driver & Employee Report', summary: [money('Total Paid', sum(p.filter((x) => x.status === 'Paid'), (x) => x.amount)), money('Pending', sum(p.filter((x) => x.status === 'Pending'), (x) => x.amount))], sections: [{ title: 'Payments', columns: empCols, rows: p }] };
    }
    case 'expenses':
      return { title: 'Expense Report', summary: [money('Total Expenses', spent), ...CATS.map((c) => money(c, cat(c)))], sections: [{ title: 'Expenses', columns: expenseCols, rows: ex }] };
    case 'pnl': {
      const days = [...new Set([...jobs.map((j) => j.date), ...ex.map((e) => e.date)])].sort();
      const rows = days.map((d) => { const i = sum(jobs.filter((j) => j.date === d), (j) => j.total), e = sum(ex.filter((x) => x.date === d), (x) => x.amount); return { date: d, income: i, expense: e, profit: round2(i - e) }; });
      const cols = [{ key: 'date', label: 'Date', type: 'date' }, { key: 'income', label: 'JCB Income', type: 'money' }, { key: 'expense', label: 'Expenses', type: 'money' }, { key: 'profit', label: 'Profit / Loss', type: 'money' }];
      return {
        title: 'Profit & Loss',
        summary: [money('Total JCB Income', income), money('Diesel Expense', cat('Diesel')), money('Driver Payments', cat('Driver')), money('Employee Payments', cat('Employee')), money('Maintenance', cat('Maintenance')), money('Repair', cat('Repair')), money('Other Expenses', cat('Other')), money('Total Expenses', spent), money('Net Profit', income - spent)],
        sections: [{ title: 'Day-wise Profit & Loss', columns: cols, rows }], chart: rows.map((x) => ({ name: fmtDate(x.date).slice(0, 5), Income: x.income, Expenses: x.expense })),
      };
    }
    case 'statement': {
      const c = D.customers.find((x) => x.id === cid);
      const sj = jobs.filter((j) => j.customerId === cid);
      return {
        title: c ? `Customer Statement - ${c.name}` : 'Customer Statement', needCustomer: !c,
        summary: [money('Total Billing', sum(sj, (j) => j.total)), money('Total Paid', sum(sj, (j) => j.paid)), money('Total Pending', sum(sj, (j) => j.pending))],
        sections: [{ title: 'All JCB Jobs', columns: statementCols, rows: sj }],
      };
    }
    default: return { title: '', summary: [], sections: [] };
  }
}

export default function Reports() {
  const { D } = useData();
  const [sp] = useSearchParams();
  const [key, setKey] = useState(sp.get('r') || 'daily');
  const [range, setRange] = useState({ preset: defaultPreset[sp.get('r') || 'daily'] || 'month' });
  const [day, setDay] = useState(today());
  const [cid, setCid] = useState(sp.get('c') || '');
  const [q, setQ] = useState('');
  const r = key === 'daily' ? { preset: 'custom', from: day, to: day } : range;
  const rep = useMemo(() => build(key, D, r, cid), [key, D, range, day, cid]); // eslint-disable-line
  const s = q.trim().toLowerCase();
  const sections = rep.sections.map((x) => ({ ...x, rows: s ? x.rows.filter((row) => x.columns.map((c) => cellVal(c, row)).join(' ').toLowerCase().includes(s)) : x.rows }));
  const rt = key === 'daily' ? fmtDate(day) : rangeText(range);
  const pick = (k) => { setKey(k); setQ(''); setRange({ preset: defaultPreset[k] || 'month' }); };

  return (
    <div>
      <PrintHead title={`${rep.title} (${rt})`} />
      <PageHeader title="Reports">
        <button className="btn ghost" onClick={() => window.print()}>🖨 Print</button>
        <button className="btn ghost" onClick={() => exportExcel(rep.title, sections, rep.summary, rt)}>📗 Excel</button>
        <button className="btn ghost" onClick={() => exportPdf(rep.title, rep.title, rt, sections, rep.summary)}>📕 PDF</button>
      </PageHeader>
      <div className="chips no-print">{TYPES.map(([k, l]) => <button key={k} className={`chip ${k === key ? 'on' : ''}`} onClick={() => pick(k)}>{l}</button>)}</div>
      <div className="card filters no-print">
        <input className="search" placeholder="🔍 Search in report..." value={q} onChange={(e) => setQ(e.target.value)} />
        {key === 'daily' ? <input type="date" value={day} onChange={(e) => setDay(e.target.value)} aria-label="Select date" /> : <DateRangeFilter value={range} onChange={setRange} />}
        {key === 'statement' && (
          <select value={cid} onChange={(e) => setCid(e.target.value)} aria-label="Customer">
            <option value="">-- Select customer --</option>{D.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      <h2 className="sec-title">{rep.title} <small className="muted">{rt}</small></h2>
      {rep.needCustomer ? <div className="card"><EmptyState text="Select a customer to see the statement" /></div> : (
        <>
          <div className="grid sums">{rep.summary.map(([l, v]) => <SummaryCard key={l} label={l} value={v} tone={l === 'Net Profit' ? 'blue' : ''} />)}</div>
          {rep.chart && rep.chart.length > 0 && (
            <div className="card chart-card no-print">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rep.chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => inr(v)} /><Legend />
                  <Bar dataKey="Income" fill="#0f766e" /><Bar dataKey="Expenses" fill="#dc2626" /></BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {sections.map((x) => <ReportTable key={x.title} section={x} multi={sections.length > 1} />)}
        </>
      )}
    </div>
  );
}
