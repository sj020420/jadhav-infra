import React from 'react';
import { useData } from '../DataContext.jsx';
import { DIESEL_PAYMENT_BY, METHODS } from '../constants.js';
import { dieselCols } from '../columns.js';
import { sum } from '../calc.js';
import { inr } from '../utils.js';
import CrudPage from '../components/CrudPage.jsx';
import DieselForm from '../forms/DieselForm.jsx';

export default function Diesel() {
  const { D } = useData();
  return (
    <CrudPage
      title="Diesel"
      collection="diesel"
      rows={D.diesel}
      columns={dieselCols}
      Form={DieselForm}
      addLabel="+ Add Diesel Entry"
      filters={[
        { key: 'paymentBy', label: 'Payment By', options: DIESEL_PAYMENT_BY },
        { key: 'method', label: 'Payment Method', options: METHODS },
      ]}
      summary={(r) => {
        const l = sum(r, (x) => x.litres);
        const c = sum(r, (x) => x.finalPrice ?? x.total);
        return [
          ['Total Diesel Litres', `${l} L`],
          ['Total Diesel Cost', inr(c), 'red'],
          ['Average Cost / Entry', inr(r.length ? c / r.length : 0)],
        ];
      }}
    />
  );
}
