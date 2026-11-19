import React from 'react';
import { COMPANY } from '../constants.js';
import { getRange } from '../utils.js';

export const Skeleton = ({ cards = 3 }) => (
  <div className="skeleton-wrap" aria-busy="true">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-line w-40" />
        <div className="skeleton-line w-70" />
        <div className="skeleton-line w-50" />
      </div>
    ))}
  </div>
);

export const Loader = ({ text = 'Loading your data...' }) => (
  <div className="center-box">
    <div className="spinner" />
    <p className="loading-text">{text}</p>
  </div>
);

export const EmptyState = ({ text = 'No records found', sub, action, actionLabel = '+ Add New' }) => (
  <div className="empty">
    <div className="empty-ico-box">
      <span className="empty-ico">📋</span>
    </div>
    <b className="empty-title">{text}</b>
    {sub && <p className="empty-sub">{sub}</p>}
    {action && (
      <button className="btn primary sm" onClick={action} style={{ marginTop: '12px' }}>
        {actionLabel}
      </button>
    )}
  </div>
);

export const PageHeader = ({ title, children }) => (
  <div className="page-head">
    <h1>{title}</h1>
    {children && <div className="head-actions no-print">{children}</div>}
  </div>
);

export const PrintHead = ({ title }) => (
  <div className="print-only print-head">
    <h2>{COMPANY.name}</h2>
    <div>{COMPANY.address} | GSTIN: {COMPANY.gstin} | {COMPANY.mobile}</div>
    {title && <h3>{title}</h3>}
  </div>
);

export const SummaryCard = ({ label, value, tone = '' }) => (
  <div className={`sum ${tone}`}>
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

export const StatusBadge = ({ v }) => <span className={`badge ${v}`}>{v}</span>;

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ text, onYes, onNo, busy }) {
  return (
    <Modal title="Please confirm" onClose={onNo}>
      <p className="confirm-text">{text}</p>
      <div className="form-actions">
        <button className="btn ghost" onClick={onNo}>No, keep it</button>
        <button className="btn danger" disabled={busy} onClick={onYes}>{busy ? 'Deleting...' : 'Yes, delete'}</button>
      </div>
    </Modal>
  );
}

export const Field = ({ label, err, hint, children, full }) => (
  <label className={`field ${full ? 'full' : ''} ${err ? 'has-err' : ''}`}>
    <span>{label}</span>
    {children}
    {hint && !err && <small className="hint">{hint}</small>}
    {err && <small className="err">⚠️ {err}</small>}
  </label>
);

export function DateRangeFilter({ value, onChange }) {
  return (
    <div className="range">
      <select value={value.preset} onChange={(e) => onChange({ ...value, preset: e.target.value })} aria-label="Date range">
        <option value="all">📅 All dates</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="custom">Custom date range...</option>
      </select>
      {value.preset === 'custom' && (
        <>
          <input type="date" value={value.from || ''} onChange={(e) => onChange({ ...value, from: e.target.value })} aria-label="From date" />
          <input type="date" value={value.to || ''} onChange={(e) => onChange({ ...value, to: e.target.value })} aria-label="To date" />
        </>
      )}
    </div>
  );
}

export { getRange };
