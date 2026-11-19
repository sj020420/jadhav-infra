import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../DataContext.jsx';
import { catOf, sum, unified } from '../calc.js';
import { fmt12, fmtDate, inr, today } from '../utils.js';
import { Confirm, Modal, PageHeader, SummaryCard } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import PaymentForm from '../forms/PaymentForm.jsx';
import JcbWorkForm from '../forms/JcbWorkForm.jsx';

export default function Dashboard() {
  const { D, remove, notify } = useData();
  const nav = useNavigate();
  const [view, setView] = useState(null);
  const [pay, setPay] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [delJob, setDelJob] = useState(null);
  const [busy, setBusy] = useState(false);

  const t = today(), ym = t.slice(0, 7);
  const ex = unified(D);
  const tj = D.jobs.filter((j) => j.date === t), mj = D.jobs.filter((j) => j.date.startsWith(ym));
  const te = ex.filter((e) => e.date === t), me = ex.filter((e) => e.date.startsWith(ym));

  const todayIncome = sum(tj, (j) => j.total);
  const monthIncome = sum(mj, (j) => j.total);
  const monthExp = sum(me, (e) => e.amount);
  const monthProfit = monthIncome - monthExp;
  const pendingTotal = sum(D.jobs, (j) => j.pending);

  const recent = [...D.jobs].sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || ''))).slice(0, 6);

  const cols = [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'customerName', label: 'Customer' },
    { key: 'location', label: 'Location' },
    { key: 'workType', label: 'Work' },
    { key: 'hours', label: 'Hours' },
    { key: 'total', label: 'Final Total', type: 'money' },
    { key: 'status', label: 'Payment', badge: true },
  ];

  const doDeleteJob = async () => {
    if (!delJob) return;
    setBusy(true);
    try {
      await remove('jobs', delJob.id);
      notify('Job deleted successfully');
      setDelJob(null);
    } catch (e) {
      notify(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Dashboard">
        <button className="btn primary big" onClick={() => nav('/jobs?new=1')}>
          + Add JCB Work
        </button>
      </PageHeader>

      {/* Quick Action Chips for Fast Mobile Operation */}
      <div className="chips no-print">
        <button className="chip on" onClick={() => nav('/jobs?new=1')}>🚜 + JCB Work</button>
        <button className="chip" onClick={() => nav('/customers')}>👥 + Customer</button>
        <button className="chip" onClick={() => nav('/expenses')}>🧾 + Expense</button>
        <button className="chip" onClick={() => nav('/diesel')}>⛽ + Diesel</button>
        <button className="chip" onClick={() => nav('/invoices')}>📄 Invoices</button>
        <button className="chip" onClick={() => nav('/reports')}>📈 Reports</button>
      </div>

      {/* Today Overview */}
      <h2 className="sec-title">📅 Today's Summary</h2>
      <div className="grid sums">
        <SummaryCard label="Today's Jobs" value={tj.length} />
        <SummaryCard label="Today's Hours" value={`${sum(tj, (j) => j.hours)} hrs`} />
        <SummaryCard label="Today's Billing" value={inr(todayIncome)} tone="green" />
        <SummaryCard label="Today's Net Cash" value={inr(todayIncome - sum(te, (e) => e.amount))} tone="blue" />
        <SummaryCard label="Pending Dues" value={inr(pendingTotal)} tone="red" />
      </div>

      {/* Monthly Financials */}
      <h2 className="sec-title">📈 This Month Overview</h2>
      <div className="grid sums">
        <SummaryCard label="Month Billing" value={inr(monthIncome)} tone="green" />
        <SummaryCard label="Month Expenses" value={inr(monthExp)} tone="red" />
        <SummaryCard label="Net Profit" value={inr(monthProfit)} tone={monthProfit >= 0 ? 'green' : 'red'} />
        <SummaryCard label="Diesel Expense" value={inr(sum(me.filter((e) => catOf(e.type) === 'Diesel'), (e) => e.amount))} />
        <SummaryCard label="Driver/Staff Pay" value={inr(sum(me.filter((e) => ['Driver', 'Employee'].includes(catOf(e.type))), (e) => e.amount))} />
      </div>

      {/* Recent Jobs */}
      <div className="page-head" style={{ marginTop: '24px', marginBottom: '10px' }}>
        <h2 className="sec-title" style={{ margin: 0 }}>🚜 Recent JCB Work</h2>
        <button className="btn sm ghost" onClick={() => nav('/jobs')}>View All →</button>
      </div>

      <div className="card flush">
        <DataTable
          columns={cols}
          rows={recent}
          empty='No jobs recorded yet. Tap "+ Add JCB Work" to add your first job.'
          actions={(r) => (
            <>
              <button className="btn sm" onClick={() => setView(r)}>👁 View</button>
              <button className="btn sm" onClick={() => setEditJob(r)}>✏️ Edit</button>
              {r.pending > 0 && (
                <button className="btn sm primary" onClick={() => setPay(r)}>💵 Pay</button>
              )}
              <button className="btn sm" onClick={() => nav(`/invoices?job=${r.id}`)}>📄 Invoice</button>
              <button className="btn sm danger-o" onClick={() => setDelJob(r)}>🗑 Delete</button>
            </>
          )}
        />
      </div>

      {/* Pay Modal */}
      {pay && (
        <Modal title={`Receive Payment - ${pay.customerName}`} onClose={() => setPay(null)}>
          <PaymentForm job={pay} onDone={() => setPay(null)} onCancel={() => setPay(null)} />
        </Modal>
      )}

      {/* Edit Job Modal */}
      {editJob && (
        <Modal title="Edit JCB Work" onClose={() => setEditJob(null)}>
          <JcbWorkForm
            initial={editJob}
            onDone={() => setEditJob(null)}
            onCancel={() => setEditJob(null)}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {delJob && (
        <Confirm
          text={`Delete job for ${delJob.customerName} on ${fmtDate(delJob.date)}? This cannot be undone.`}
          busy={busy}
          onNo={() => setDelJob(null)}
          onYes={doDeleteJob}
        />
      )}

      {/* View Modal */}
      {view && (
        <Modal title="JCB Work Details" onClose={() => setView(null)}>
          <div className="kv">
            <span>Customer</span><b>{view.customerName}</b>
            <span>Mobile</span><b>{view.mobile || '-'}</b>
            <span>Location</span><b>{view.location || '-'}</b>
            <span>Work Type</span><b>{view.workType}</b>
            <span>Date</span><b>{fmtDate(view.date)}</b>
            <span>Time</span><b>{fmt12(view.start)} to {fmt12(view.end)}</b>
            <span>Hours</span><b>{view.hours} hrs</b>
            <span>Rate</span><b>{inr(view.rate)}/hr</b>
            {view.calculatedTotal !== undefined && view.calculatedTotal !== null && view.calculatedTotal !== view.total && (
              <><span>Original Price</span><b>{inr(view.calculatedTotal)}</b></>
            )}
            {view.finalPrice !== null && view.finalPrice !== undefined && (
              <><span>Admin Final Price</span><b>{inr(view.finalPrice)}</b></>
            )}
            <span>Final Total</span><b>{inr(view.total)}</b>
            <span>Paid</span><b>{inr(view.paid)}</b>
            <span>Pending</span><b>{inr(view.pending)}</b>
            <span>Payment Status</span><b><span className={`badge ${view.status}`}>{view.status}</span></b>
            {(view.payments || []).map((p, i) => (
              <React.Fragment key={i}>
                <span>Payment {i + 1}</span>
                <b>{inr(p.amount)} · {p.method} · {fmtDate(p.date)}</b>
              </React.Fragment>
            ))}
            {view.notes && <><span>Notes</span><b>{view.notes}</b></>}
          </div>

          <div className="form-actions" style={{ marginTop: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button
              className="btn danger-o"
              onClick={() => {
                const j = view;
                setView(null);
                setDelJob(j);
              }}
            >
              🗑 Delete Job
            </button>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn"
                onClick={() => {
                  const j = view;
                  setView(null);
                  setEditJob(j);
                }}
              >
                ✏️ Edit Job
              </button>
              {view.pending > 0 && (
                <button
                  className="btn primary"
                  onClick={() => {
                    const j = view;
                    setView(null);
                    setPay(j);
                  }}
                >
                  💵 Receive Payment ({inr(view.pending)})
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
