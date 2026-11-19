import React from 'react';
import { cellVal, disp, inr } from '../utils.js';
import { EmptyState } from './ui.jsx';

export default function DataTable({ columns, rows, actions, sort, onSort, empty }) {
  if (!rows || !rows.length) return <EmptyState text={empty || 'No records found'} />;

  // Helper to extract clean mobile card fields
  const renderMobileCard = (r, i) => {
    // 1. Primary Title
    let title = r.customerName || r.name || r.supplier || r.description || r.number;
    if (!title && r.date) title = disp({ type: 'date', key: 'date' }, r);
    if (!title) title = (columns && columns[0] ? cellVal(columns[0], r) : null) || 'Record';

    // 2. Status Badge
    const badgeCol = columns ? columns.find((c) => c.badge) : null;
    const statusVal = r.status || (badgeCol ? cellVal(badgeCol, r) : null);

    // 3. Metadata items
    const meta = [];
    if (r.date && title !== disp({ type: 'date', key: 'date' }, r)) {
      meta.push({ ico: '📅', label: 'Date', val: disp({ type: 'date', key: 'date' }, r) });
    }
    if (r.workType) meta.push({ ico: '🚜', label: 'Work', val: r.workType });
    if (r.location) meta.push({ ico: '📍', label: 'Site', val: r.location });
    if (r.hours !== undefined && r.hours !== null) meta.push({ ico: '⏱️', label: 'Hours', val: `${r.hours} hrs` });
    if (r.rate && !r.litres) meta.push({ ico: '🏷️', label: 'Rate', val: `${inr(r.rate)}/hr` });
    if (r.machine && !r.workType) meta.push({ ico: '🚜', label: 'Machine', val: r.machine });
    if (r.litres) meta.push({ ico: '⛽', label: 'Diesel', val: `${r.litres} L` });
    if (r.rate && r.litres) meta.push({ ico: '🏷️', label: 'Rate', val: `${inr(r.rate)}/L` });
    if (r.type && !r.workType) meta.push({ ico: '🧾', label: 'Type', val: r.type });
    if (r.reason) meta.push({ ico: '📝', label: 'Reason', val: r.reason });
    if (r.mobile && r.customerName !== r.name) meta.push({ ico: '📞', label: 'Mobile', val: r.mobile });
    if (r.jobs !== undefined && r.jobs !== null) meta.push({ ico: '🚜', label: 'Total Jobs', val: `${r.jobs} jobs` });
    if (r.paidTo) meta.push({ ico: '👤', label: 'Paid To', val: r.paidTo });
    if (r.supplier && title !== r.supplier) meta.push({ ico: '⛽', label: 'Supplier', val: r.supplier });
    if (r.method) meta.push({ ico: '💳', label: 'Method', val: r.method });
    if (r.personType) meta.push({ ico: '👷', label: 'Role', val: r.personType });

    // 4. Financial highlights
    const hasTotal = r.total !== undefined && r.total !== null;
    const hasGrand = r.grandTotal !== undefined && r.grandTotal !== null;
    const hasAmount = r.amount !== undefined && r.amount !== null;
    const hasIncome = r.income !== undefined && r.income !== null;
    const hasExpense = r.expense !== undefined && r.expense !== null;
    const hasProfit = r.profit !== undefined && r.profit !== null;

    const finalAmount = hasTotal ? inr(r.total) : hasGrand ? inr(r.grandTotal) : hasAmount ? inr(r.amount) : hasIncome ? inr(r.income) : null;
    const finalLabel = hasTotal ? 'Final Total' : hasGrand ? 'Grand Total' : hasAmount ? 'Amount' : hasIncome ? 'Income' : 'Total';

    const pendingVal = r.pending !== undefined && Number(r.pending) > 0 ? inr(r.pending) : null;
    const paidVal = r.paid !== undefined && Number(r.paid) > 0 ? inr(r.paid) : null;

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
                <span className="m-meta-ico">{m.ico}</span>
                <span className="m-meta-val">{m.val}</span>
              </span>
            ))}
          </div>
        )}

        {(finalAmount || hasProfit || hasExpense) && (
          <div className="m-card-finance">
            {finalAmount && (
              <div className="m-amount-col">
                <span className="m-amount-label">{finalLabel}</span>
                <b className="m-amount-val">{finalAmount}</b>
              </div>
            )}
            {hasExpense && (
              <div className="m-amount-col">
                <span className="m-amount-label">Expense</span>
                <b className="m-amount-val red">{inr(r.expense)}</b>
              </div>
            )}
            {hasProfit && (
              <div className={`m-amount-col right ${r.profit >= 0 ? 'green' : 'red'}`}>
                <span className="m-amount-label">Profit / Loss</span>
                <b className="m-amount-val">{inr(r.profit)}</b>
              </div>
            )}
            {pendingVal && !hasProfit ? (
              <div className="m-amount-col right red">
                <span className="m-amount-label">Pending</span>
                <b className="m-amount-val">{pendingVal}</b>
              </div>
            ) : statusVal === 'Paid' && !hasProfit ? (
              <div className="m-amount-col right green">
                <span className="m-amount-label">{paidVal ? `Paid: ${paidVal}` : 'Status'}</span>
                <b className="m-amount-val">✓ Paid</b>
              </div>
            ) : null}
          </div>
        )}

        {r.notes && (
          <div className="m-card-notes">
            <span className="m-notes-label">📝</span>
            <span className="m-notes-text">{r.notes}</span>
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
