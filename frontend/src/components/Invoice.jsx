import React from 'react';
import { COMPANY } from '../constants.js';
import { fmtDate, inr } from '../utils.js';

// Printable invoice (on-screen + browser print)
export default function Invoice({ inv }) {
  const c = inv.customer || { name: inv.customerName || 'Customer', mobile: inv.mobile, address: inv.address, gstin: inv.gstin };
  const k = inv.work || {};
  const hoursVal = inv.hours !== undefined && inv.hours !== null && inv.hours !== '' ? inv.hours : k.hours;
  const priceVal = inv.price !== undefined && inv.price !== null && inv.price !== '' ? inv.price : k.rate;
  const finalPriceVal = inv.finalPrice !== undefined && inv.finalPrice !== null && inv.finalPrice !== '' ? inv.finalPrice : inv.grandTotal ?? k.finalPrice ?? k.amount ?? 0;

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
        <div className="inv-title">
          <h2>{inv.gstEnabled ? 'TAX INVOICE' : 'INVOICE'}</h2>
          <div>No: <b>{inv.number}</b></div>
          <div>Date: <b>{fmtDate(inv.date)}</b></div>
        </div>
      </div>

      <div className="inv-bill">
        <b>Bill To</b>
        <div className="big">{c.name}</div>
        {c.mobile && <div>Mobile: {c.mobile}</div>}
        {c.address && <div>{c.address}</div>}
        {c.gstin && <div>GSTIN: {c.gstin}</div>}
      </div>

      <div className="table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description of Work</th>
              <th>Site Location</th>
              <th>Hours</th>
              <th>Price</th>
              <th>Final Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{fmtDate(inv.date || k.date)}</td>
              <td>{k.description || inv.description || 'JCB Work'}</td>
              <td>{k.location || inv.location || '-'}</td>
              <td>{hoursVal !== undefined && hoursVal !== null ? `${hoursVal} hrs` : '-'}</td>
              <td>{priceVal !== undefined && priceVal !== null ? inr(priceVal) : '-'}</td>
              <td><b>{inr(finalPriceVal)}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="inv-totals">
        <div>
          <span>Subtotal</span>
          <b>{inr(inv.subtotal ?? finalPriceVal)}</b>
        </div>
        {inv.gstEnabled && (
          inv.igst ? (
            <div>
              <span>IGST @ {inv.gstRate}%</span>
              <b>{inr(inv.gstAmount)}</b>
            </div>
          ) : (
            <>
              <div>
                <span>CGST @ {inv.gstRate / 2}%</span>
                <b>{inr(inv.gstAmount / 2)}</b>
              </div>
              <div>
                <span>SGST @ {inv.gstRate / 2}%</span>
                <b>{inr(inv.gstAmount / 2)}</b>
              </div>
            </>
          )
        )}
        <div className="grand">
          <span>Grand Total</span>
          <b>{inr(inv.grandTotal ?? finalPriceVal)}</b>
        </div>
        <div>
          <span>Paid Amount</span>
          <b>{inr(inv.paid ?? 0)}</b>
        </div>
        <div>
          <span>Pending Amount</span>
          <b>{inr(inv.pending ?? 0)}</b>
        </div>
      </div>

      <div className="inv-meta">
        Payment Method: <b>{inv.method || '-'}</b> &nbsp;|&nbsp; Payment Status: <b>{inv.status || 'Unpaid'}</b>
      </div>
      {inv.notes && <div className="inv-meta">Notes: {inv.notes}</div>}

      <div className="inv-sign">
        <div>For <b>{COMPANY.name}</b></div>
        <div className="line">Authorised Signatory</div>
      </div>
    </div>
  );
}
