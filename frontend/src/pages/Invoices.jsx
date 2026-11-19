import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../DataContext.jsx';
import { COMPANY } from '../constants.js';
import { invoicePdf } from '../export.js';
import Invoice from '../components/Invoice.jsx';
import DataTable from '../components/DataTable.jsx';
import { Confirm, EmptyState, Modal, PageHeader } from '../components/ui.jsx';
import InvoiceForm from '../forms/InvoiceForm.jsx';

export function InvoiceView() {
  const { id } = useParams();
  const { D, remove, notify } = useData();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState(false);

  const inv = D.invoices.find((i) => i.id === id);
  if (!inv) {
    return (
      <div className="card">
        <EmptyState text="Invoice not found" />
        <button className="btn" onClick={() => nav('/invoices')}>← Back to invoices</button>
      </div>
    );
  }

  const doDelete = async () => {
    setBusy(true);
    try {
      await remove('invoices', inv.id);
      notify('Invoice deleted successfully');
      nav('/invoices');
    } catch (e) {
      notify(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-head no-print">
        <button className="btn ghost" onClick={() => nav('/invoices')}>← Back</button>
        <div className="head-actions">
          <button className="btn" onClick={() => setEditing(true)}>✏️ Edit Invoice</button>
          <button className="btn primary big" onClick={() => window.print()}>🖨 Print</button>
          <button className="btn big" onClick={() => invoicePdf(inv)}>⬇ Download PDF</button>
          <button className="btn danger-o" onClick={() => setDel(true)}>🗑 Delete</button>
        </div>
      </div>

      <Invoice inv={inv} />

      {editing && (
        <Modal title={`Edit Invoice - ${inv.number}`} onClose={() => setEditing(false)} wide>
          <InvoiceForm
            initial={inv}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}

      {del && (
        <Confirm
          text={`Are you sure you want to delete invoice ${inv.number}? This cannot be undone.`}
          busy={busy}
          onNo={() => setDel(false)}
          onYes={doDelete}
        />
      )}
    </div>
  );
}

export default function Invoices() {
  const { D, remove, notify } = useData();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const preset = sp.get('job');
  useEffect(() => {
    if (preset) setOpen(true);
  }, [preset]);

  const cols = [
    { key: 'number', label: 'Invoice No' },
    { key: 'date', label: 'Date', type: 'date' },
    {
      key: 'customer',
      label: 'Customer',
      val: (r) => r.customer?.name || r.customerName || 'Customer',
    },
    {
      key: 'hours',
      label: 'Hours',
      val: (r) => (r.hours !== undefined && r.hours !== null && r.hours !== '' ? `${r.hours} hrs` : r.work?.hours !== undefined && r.work?.hours !== null ? `${r.work.hours} hrs` : '-'),
    },
    {
      key: 'price',
      label: 'Price',
      type: 'money',
      val: (r) => (r.price !== undefined && r.price !== null && r.price !== '' ? r.price : r.work?.rate ?? 0),
    },
    {
      key: 'finalPrice',
      label: 'Final Price',
      type: 'money',
      val: (r) => (r.finalPrice !== undefined && r.finalPrice !== null && r.finalPrice !== '' ? r.finalPrice : r.grandTotal ?? r.work?.finalPrice ?? r.work?.amount ?? 0),
    },
    {
      key: 'status',
      label: 'Status',
      badge: true,
      val: (r) => r.status || 'Unpaid',
    },
  ];

  const close = () => {
    setOpen(false);
    setEditInv(null);
    setSp({});
  };

  const doDelete = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await remove('invoices', del.id);
      notify('Invoice deleted successfully');
      setDel(null);
    } catch (e) {
      notify(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Invoices">
        <button className="btn primary big" onClick={() => setOpen(true)}>
          + Generate Invoice
        </button>
      </PageHeader>
      <p className="note no-print">
        Manual Entry: Enter Hours, Price, and Final Price manually. Invoices are billed from <b>{COMPANY.name}</b>.
      </p>

      <div className="card flush">
        <DataTable
          columns={cols}
          rows={D.invoices}
          empty='No invoices yet. Tap "+ Generate Invoice" to create your first invoice.'
          actions={(r) => (
            <>
              <button className="btn sm" onClick={() => nav(`/invoices/${r.id}`)}>
                👁 View / Print
              </button>
              <button className="btn sm" onClick={() => setEditInv(r)}>
                ✏️ Edit
              </button>
              <button className="btn sm danger-o" onClick={() => setDel(r)}>
                🗑 Delete
              </button>
            </>
          )}
        />
      </div>

      {open && (
        <Modal title="Generate Invoice (Manual Entry)" onClose={close} wide>
          <InvoiceForm
            presetJob={preset}
            onDone={(saved) => {
              close();
              if (saved?.id) nav(`/invoices/${saved.id}`);
            }}
            onCancel={close}
          />
        </Modal>
      )}

      {editInv && (
        <Modal title={`Edit Invoice - ${editInv.number}`} onClose={close} wide>
          <InvoiceForm
            initial={editInv}
            onDone={() => close()}
            onCancel={close}
          />
        </Modal>
      )}

      {del && (
        <Confirm
          text={`Are you sure you want to delete invoice ${del.number}? The underlying JCB work record is not affected.`}
          busy={busy}
          onNo={() => setDel(null)}
          onYes={doDelete}
        />
      )}
    </div>
  );
}
