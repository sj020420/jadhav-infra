import React from 'react';
import { useData } from '../DataContext.jsx';
import { EMP_METHODS, PERSON_TYPES } from '../constants.js';
import { empCols } from '../columns.js';
import { sum } from '../calc.js';
import { inr } from '../utils.js';
import CrudPage from '../components/CrudPage.jsx';
import EmployeePaymentForm from '../forms/EmployeePaymentForm.jsx';

export default function Employees() {
  const { D } = useData();
  return (
    <CrudPage
      title="Driver & Employee Payments" collection="employee_payments" rows={D.employee_payments} columns={empCols} Form={EmployeePaymentForm} addLabel="+ Add Payment"
      filters={[{ key: 'personType', label: 'Type', options: PERSON_TYPES }, { key: 'status', label: 'Status', options: ['Paid', 'Pending'] }, { key: 'method', label: 'Payment Method', options: EMP_METHODS }]}
      summary={(r) => [['Total Paid', inr(sum(r.filter((p) => p.status === 'Paid'), (p) => p.amount)), 'green'], ['Pending', inr(sum(r.filter((p) => p.status === 'Pending'), (p) => p.amount)), 'red'], ['Entries', r.length]]}
    />
  );
}
