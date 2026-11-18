// ===== Excel + PDF export (works on any list of sections) =====
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY } from './constants.js';
import { expVal, fmtDate, pinr, today } from './utils.js';

const safeName = (s) => String(s).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');

export function exportExcel(file, sections, summary = [], range = '') {
  const wb = XLSX.utils.book_new();
  sections.forEach((s, i) => {
    const aoa = [[COMPANY.name], [`${COMPANY.address}  GSTIN: ${COMPANY.gstin}`], [s.title || file], [range], [],
      s.columns.map((c) => c.label),
      ...s.rows.map((r) => s.columns.map((c) => expVal(c, r)))];
    if (i === 0 && summary.length) aoa.push([], ['SUMMARY'], ...summary.map(([l, v]) => [l, typeof v === 'string' && v.startsWith('₹') ? Number(v.replace(/[₹,]/g, '')) : v]));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = s.columns.map((c) => ({ wch: Math.max(14, c.label.length + 4) }));
    const name = ((s.title || 'Sheet').replace(/[\\/?*[\]:]/g, '').slice(0, 24) + (i ? ` ${i + 1}` : '')) || `Sheet${i + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, `${safeName(file)}_${today()}.xlsx`);
}

function pdfHeader(doc, title, range) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(15, 118, 110).text(COMPANY.name, 30, 40);
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60);
  doc.text(`Prop: ${COMPANY.proprietor}`, 30, 54);
  doc.text(COMPANY.address, 30, 66);
  doc.text(`GSTIN: ${COMPANY.gstin}   Mobile: ${COMPANY.mobile}   Email: ${COMPANY.email}`, 30, 78);
  doc.setDrawColor(15, 118, 110).line(30, 86, w - 30, 86);
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(20).text(title, 30, 106);
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90).text(`${range || ''}   |   Generated: ${fmtDate(today())}`, 30, 120);
  return 134;
}

export function exportPdf(file, title, range, sections, summary = []) {
  const wide = Math.max(...sections.map((s) => s.columns.length)) > 7;
  const doc = new jsPDF({ orientation: wide ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  let y = pdfHeader(doc, title, range);
  const H = doc.internal.pageSize.getHeight();
  sections.forEach((s) => {
    if (y > H - 120) { doc.addPage(); y = 40; }
    if (s.title && sections.length > 1) { doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(20).text(s.title, 30, y); y += 8; }
    autoTable(doc, {
      startY: y, margin: { left: 30, right: 30 },
      head: [s.columns.map((c) => c.label)],
      body: s.rows.length ? s.rows.map((r) => s.columns.map((c) => String(expVal(c, r, true)))) : [['No records']],
      styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [15, 118, 110] },
      columnStyles: Object.fromEntries(s.columns.map((c, i) => [i, c.type === 'money' ? { halign: 'right' } : {}])),
    });
    y = doc.lastAutoTable.finalY + 18;
  });
  if (summary.length) {
    if (y > H - 100) { doc.addPage(); y = 40; }
    autoTable(doc, {
      startY: y, margin: { left: 30, right: 30 }, theme: 'grid',
      head: [['Summary', 'Value']],
      body: summary.map(([l, v]) => [l, String(v).replace('₹', 'Rs. ')]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [29, 78, 216] }, columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });
  }
  doc.save(`${safeName(file)}_${today()}.pdf`);
}

export function invoicePdf(inv) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  let y = pdfHeader(doc, inv.gstEnabled ? 'TAX INVOICE' : 'INVOICE', '');
  doc.setFontSize(10).setTextColor(20);
  doc.text(`Invoice No: ${inv.number}`, w - 30, 106, { align: 'right' });
  doc.text(`Invoice Date: ${fmtDate(inv.date)}`, w - 30, 120, { align: 'right' });
  doc.setFont('helvetica', 'bold').text('Bill To:', 30, y + 6);
  doc.setFont('helvetica', 'normal');
  const c = inv.customer;
  const lines = [c.name, c.mobile && `Mobile: ${c.mobile}`, c.address, c.gstin && `GSTIN: ${c.gstin}`].filter(Boolean);
  lines.forEach((l, i) => doc.text(String(l), 30, y + 20 + i * 13));
  y += 30 + lines.length * 13;
  const k = inv.work;
  autoTable(doc, {
    startY: y, margin: { left: 30, right: 30 },
    head: [['Date', 'Description of Work', 'Site', 'Start', 'End', 'Hours', 'Rate/Hr', 'Amount']],
    body: [[fmtDate(k.date), k.description, k.location || '-', k.start, k.end, k.hours, pinr(k.rate), pinr(k.amount)]],
    styles: { fontSize: 9 }, headStyles: { fillColor: [15, 118, 110] },
  });
  const rows = [['Subtotal', pinr(inv.subtotal)]];
  if (inv.gstEnabled) {
    if (inv.igst) rows.push([`IGST @ ${inv.gstRate}%`, pinr(inv.gstAmount)]);
    else rows.push([`CGST @ ${inv.gstRate / 2}%`, pinr(inv.gstAmount / 2)], [`SGST @ ${inv.gstRate / 2}%`, pinr(inv.gstAmount / 2)]);
  }
  rows.push(['Grand Total', pinr(inv.grandTotal)], ['Paid Amount', pinr(inv.paid)], ['Pending Amount', pinr(inv.pending)]);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 12, margin: { left: w - 260, right: 30 }, theme: 'plain', body: rows,
    styles: { fontSize: 10 }, columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });
  y = doc.lastAutoTable.finalY + 16;
  doc.setFontSize(10).text(`Payment Method: ${inv.method || '-'}     Payment Status: ${inv.status}`, 30, y);
  if (inv.notes) doc.text(`Notes: ${inv.notes}`, 30, y + 16);
  doc.setFont('helvetica', 'bold').text(`For ${COMPANY.name}`, w - 30, y + 70, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(9).text('Authorised Signatory', w - 30, y + 110, { align: 'right' });
  doc.save(`Invoice_${safeName(inv.number)}.pdf`);
}
