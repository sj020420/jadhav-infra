import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../DataContext.jsx';
import { METHODS, PAY_STATUS, WORK_TYPES } from '../constants.js';
import { jobCols } from '../columns.js';
import { sum } from '../calc.js';
import { fmt12, fmtDate, inr } from '../utils.js';
import CrudPage from '../components/CrudPage.jsx';
import JcbWorkForm from '../forms/JcbWorkForm.jsx';
import PaymentForm from '../forms/PaymentForm.jsx';
import { Confirm, Modal } from '../components/ui.jsx';

export default function JcbWork() {
  const { D, remove, notify } = useData();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [view, setView] = useState(null);
  const [pay, setPay] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [delJob, setDelJob] = useState(null);
  const [busy, setBusy] = useState(false);

  const names = [...new Set(D.jobs.map((j) => j.customerName))].sort();

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
    <>
      <CrudPage
        title="JCB Work"
        collection="jobs"
        rows={D.jobs}
        columns={jobCols}
        Form={JcbWorkForm}
        addLabel="+ Add New JCB Work"
        openNew={sp.get('new')}
        onNewHandled={() => setSp({})}
        filters={[
          { key: 'customerName', label: 'Customer', options: names },
          { key: 'status', label: 'Payment Status', options: PAY_STATUS },
          { key: 'workType', label: 'Work Type', options: WORK_TYPES },
          { key: 'method', label: 'Payment Method', options: METHODS },
        ]}
        summary={(r) => [
          ['Jobs', r.length],
          ['Total Hours', sum(r, (j) => j.hours)],
          ['Total Billing', inr(sum(r, (j) => j.total)), 'green'],
          ['Paid', inr(sum(r, (j) => j.paid))],
          ['Pending', inr(sum(r, (j) => j.pending)), 'red'],
        ]}
        deleteText={(r) => `Delete the job for ${r.customerName} on ${fmtDate(r.date)}? This cannot be undone.`}
        extraActions={(r) => (
          <>
            <button className="btn sm" onClick={() => setView(r)}>👁 View</button>
            {r.pending > 0 && <button className="btn sm primary" onClick={() => setPay(r)}>💵 Pay</button>}
            <button className="btn sm" onClick={() => nav(`/invoices?job=${r.id}`)}>📄 Invoice</button>
          </>
        )}
      />

      {pay && (
        <Modal title={`Receive Payment - ${pay.customerName}`} onClose={() => setPay(null)}>
          <PaymentForm job={pay} onDone={() => setPay(null)} onCancel={() => setPay(null)} />
        </Modal>
      )}

      {editJob && (
        <Modal title="Edit JCB Work" onClose={() => setEditJob(null)}>
          <JcbWorkForm
            initial={editJob}
            onDone={() => setEditJob(null)}
            onCancel={() => setEditJob(null)}
          />
        </Modal>
      )}

      {delJob && (
        <Confirm
          text={`Delete job for ${delJob.customerName} on ${fmtDate(delJob.date)}? This cannot be undone.`}
          busy={busy}
          onNo={() => setDelJob(null)}
          onYes={doDeleteJob}
        />
      )}

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
              <><span>Original/Calculated Price</span><b>{inr(view.calculatedTotal)}</b></>
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
    </>
  );
}
