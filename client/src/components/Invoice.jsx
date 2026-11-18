import React from 'react';
import { COMPANY } from '../constants.js';
import { fmt12, fmtDate, inr } from '../utils.js';

// Printable invoice (on-screen + browser print)
export default function Invoice({ inv }) {
  const c = inv.customer, k = inv.work;
  return (
    <div className="invoice-sheet">
      <div className="inv-top">
        <div>
          <h1>{COMPANY.name}</h1>
          <div>Prop: {COMPANY.proprietor}</div>
          <div>{COMPANY.address}</div>
          <div>GSTIN: {COMPANY.gstin}</div>
          <div>{COMPANY.email} | {COMPANY.mobile}</div>
        </div>
        <div className="inv-title"><h2>{inv.gstEnabled ? 'TAX INVOICE' : 'INVOICE'}</h2>
          <div>No: <b>{inv.number}</b></div><div>Date: <b>{fmtDate(inv.date)}</b></div></div>
      </div>
      <div className="inv-bill"><b>Bill To</b><div className="big">{c.name}</div>
        {c.mobile && <div>Mobile: {c.mobile}</div>}{c.address && <div>{c.address}</div>}{c.gstin && <div>GSTIN: {c.gstin}</div>}</div>
      <div className="table-wrap"><table className="inv-table">
        <thead><tr><th>Date</th><th>Description of Work</th><th>Site Location</th><th>Start</th><th>End</th><th>Hours</th><th>Rate/Hr</th><th>Amount</th></tr></thead>
        <tbody><tr><td>{fmtDate(k.date)}</td><td>{k.description}</td><td>{k.location || '-'}</td><td>{fmt12(k.start)}</td><td>{fmt12(k.end)}</td><td>{k.hours}</td><td>{inr(k.rate)}</td><td>{inr(k.amount)}</td></tr></tbody>
      </table></div>
      <div className="inv-totals">
        <div><span>Subtotal</span><b>{inr(inv.subtotal)}</b></div>
        {inv.gstEnabled && (inv.igst
          ? <div><span>IGST @ {inv.gstRate}%</span><b>{inr(inv.gstAmount)}</b></div>
          : <><div><span>CGST @ {inv.gstRate / 2}%</span><b>{inr(inv.gstAmount / 2)}</b></div><div><span>SGST @ {inv.gstRate / 2}%</span><b>{inr(inv.gstAmount / 2)}</b></div></>)}
        <div className="grand"><span>Grand Total</span><b>{inr(inv.grandTotal)}</b></div>
        <div><span>Paid Amount</span><b>{inr(inv.paid)}</b></div>
        <div><span>Pending Amount</span><b>{inr(inv.pending)}</b></div>
      </div>
      <div className="inv-meta">Payment Method: <b>{inv.method || '-'}</b> &nbsp;|&nbsp; Payment Status: <b>{inv.status}</b></div>
      {inv.notes && <div className="inv-meta">Notes: {inv.notes}</div>}
      <div className="inv-sign"><div>For <b>{COMPANY.name}</b></div><div className="line">Authorised Signatory</div></div>
    </div>
  );
}
