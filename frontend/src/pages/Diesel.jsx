import React from 'react';
import { useData } from '../DataContext.jsx';
import { METHODS } from '../constants.js';
import { dieselCols } from '../columns.js';
import { sum } from '../calc.js';
import { inr, round2 } from '../utils.js';
import CrudPage from '../components/CrudPage.jsx';
import DieselForm from '../forms/DieselForm.jsx';

export default function Diesel() {
  const { D } = useData();
  return (
    <CrudPage
      title="Diesel" collection="diesel" rows={D.diesel} columns={dieselCols} Form={DieselForm} addLabel="+ Add Diesel Entry"
      filters={[{ key: 'method', label: 'Payment Method', options: METHODS }]}
      summary={(r) => {
        const l = sum(r, (x) => x.litres), c = sum(r, (x) => x.total);
        return [['Total Diesel Litres', `${l} L`], ['Total Diesel Cost', inr(c), 'red'], ['Average Cost / Entry', inr(r.length ? c / r.length : 0)], ['Average Rate / Litre', inr(l ? round2(c / l) : 0)]];
      }}
    />
  );
}
