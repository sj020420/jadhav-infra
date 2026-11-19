import React from 'react';
import { cellVal, disp, inr } from '../utils.js';
import { EmptyState } from './ui.jsx';

export default function DataTable({ columns, rows, actions, sort, onSort, empty }) {
  if (!rows || !rows.length) return <EmptyState text={empty || 'No records found'} />;

  // Helper to extract clean mobile card fields
  const renderMobileCard = (r, i) => {
    // 1. Primary Title
    const title = r.customerName || r.name || r.supplier || r.description || r.number || cellVal(columns[0], r);

    // 2. Status Badge
    const statusVal = r.status || (columns.find((c) => c.badge) ? cellVal(columns.find((c) => c.badge), r) : null);

    // 3. Metadata items
    const meta = [];
    if (r.date) meta.push({ ico: '📅', val: disp({ type: 'date', key: 'date' }, r) });
    if (r.workType) meta.push({ ico: '🚜', val: r.workType });
    if (r.location) meta.push({ ico: '📍', val: r.location });
    if (r.hours) meta.push({ ico: '⏱️', val: `${r.hours} hrs` });
    if (r.machine && !r.workType) meta.push({ ico: '🚜', val: r.machine });
    if (r.litres) meta.push({ ico: '⛽', val: `${r.litres} L` });
    if (r.type && !r.workType) meta.push({ ico: '🧾', val: r.type });
    if (r.reason) meta.push({ ico: '📝', val: r.reason });
    if (r.mobile && r.customerName !== r.name) meta.push({ ico: '📞', val: r.mobile });

    // 4. Financial highlights
    const hasTotal = r.total !== undefined && r.total !== null;
    const hasGrand = r.grandTotal !== undefined && r.grandTotal !== null;
    const hasAmount = r.amount !== undefined && r.amount !== null;
    const finalAmount = hasTotal ? inr(r.total) : hasGrand ? inr(r.grandTotal) : hasAmount ? inr(r.amount) : null;
    const pendingVal = r.pending !== undefined && Number(r.pending) > 0 ? inr(r.pending) : null;

    return (
      <div key={r.id || i} className="m-record-card">
        <div className="m-card-header">
          <div className="m-card-title">{title}</div>
          {statusVal && <span className={`badge ${statusVal}`}>{statusVal}</span>}
        </div>

        {meta.length > 0 && (
          <div className="m-card-meta">
            {meta.map((m, idx) => (
              <span key={idx} className="m-meta-item">
                <span>{m.ico}</span>
                <span>{m.val}</span>
              </span>
            ))}
          </div>
        )}

        {finalAmount && (
          <div className="m-card-finance">
            <div className="m-amount-col">
              <span className="m-amount-label">{hasTotal ? 'Final Total' : hasGrand ? 'Grand Total' : 'Amount'}</span>
              <b className="m-amount-val">{finalAmount}</b>
            </div>
            {pendingVal ? (
              <div className="m-amount-col right red">
                <span className="m-amount-label">Pending</span>
                <b className="m-amount-val">{pendingVal}</b>
              </div>
            ) : statusVal === 'Paid' ? (
              <div className="m-amount-col right green">
                <span className="m-amount-label">Status</span>
                <b className="m-amount-val">✓ Paid</b>
              </div>
            ) : null}
          </div>
        )}

        {actions && <div className="m-card-actions">{actions(r)}</div>}
      </div>
    );
  };

  return (
    <>
      {/* 1. Mobile Cards View (displayed below 768px) */}
      <div className="mobile-cards-view">
        {rows.map(renderMobileCard)}
      </div>

      {/* 2. Desktop Table View (displayed 768px and up) */}
      <div className="desktop-table-view table-wrap">
        <table className="dt">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} onClick={() => onSort && onSort(c.key)} className={onSort ? 'sortable' : ''}>
                  {c.label}{sort && sort.key === c.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i}>
                {columns.map((c) => (
                  <td key={c.key} data-label={c.label} className={c.type === 'money' ? 'num' : ''}>
                    {c.render ? c.render(r) : c.badge ? <span className={`badge ${cellVal(c, r)}`}>{cellVal(c, r)}</span> : disp(c, r)}
                  </td>
                ))}
                {actions && <td data-label="Actions" className="acts">{actions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
