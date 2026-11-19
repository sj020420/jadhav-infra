import React from 'react';
import { useData } from '../DataContext.jsx';
import { CATS, EXPENSE_TYPES, METHODS } from '../constants.js';
import { catOf, sum, unified } from '../calc.js';
import { expenseCols } from '../columns.js';
import { inr } from '../utils.js';
import CrudPage from '../components/CrudPage.jsx';
import ExpenseForm from '../forms/ExpenseForm.jsx';

export default function Expenses() {
  const { D } = useData();
  const rows = unified(D);
  const cols = [...expenseCols.slice(0, 6), { key: 'source', label: 'Added From', val: (r) => ({ expenses: 'Expenses', diesel: 'Diesel page', employee_payments: 'Staff payments' }[r.source]) }, expenseCols[6]];
  return (
    <CrudPage
      title="Expenses" collection="expenses" rows={rows} columns={cols} Form={ExpenseForm} addLabel="+ Add Expense"
      note="Diesel entries and paid driver/employee payments are included here automatically. Edit those in their own pages."
      editable={(r) => r.source === 'expenses'} lockedNote={() => 'Edit in its own page'}
      filters={[{ key: 'type', label: 'Expense Type', options: EXPENSE_TYPES }, { key: 'method', label: 'Payment Method', options: METHODS }]}
      summary={(r) => [['Total Expenses', inr(sum(r, (e) => e.amount)), 'red'], ...CATS.map((c) => [c, inr(sum(r.filter((e) => catOf(e.type) === c), (e) => e.amount))])]}
    />
  );
}
