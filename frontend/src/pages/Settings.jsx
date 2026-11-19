import React, { useRef, useState } from 'react';
import { api } from '../api.js';
import { useData } from '../DataContext.jsx';
import { COMPANY } from '../constants.js';
import { getSettings, setSettings, today } from '../utils.js';
import { Confirm, Field, PageHeader } from '../components/ui.jsx';

export default function Settings() {
  const { notify, reload, D } = useData();
  const [s, setS] = useState(getSettings());
  const [pending, setPending] = useState(null);
  const file = useRef();

  const backup = async () => {
    try {
      const data = await api.backup();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `jadhav-infra-backup-${today()}.json`; a.click();
      notify('Backup downloaded');
    } catch (e) { notify(e.message, 'err'); }
  };
  const pick = async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!j.data) throw new Error(); setPending(j); } catch { notify('This is not a valid backup file', 'err'); }
  };
  const restore = async () => {
    try { await api.restore(pending); await reload(); notify('Backup restored'); } catch (e) { notify(e.message, 'err'); }
    setPending(null);
  };

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="card">
        <h3>Company Details (used on invoices & reports)</h3>
        <div className="kv"><span>Name</span><b>{COMPANY.name}</b><span>Proprietor</span><b>{COMPANY.proprietor}</b><span>Address</span><b>{COMPANY.address}</b><span>GSTIN</span><b>{COMPANY.gstin}</b><span>Email</span><b>{COMPANY.email}</b><span>Mobile</span><b>{COMPANY.mobile}</b></div>
        <p className="muted">To change these, edit <code>client/src/constants.js</code>.</p>
      </div>
      <div className="card">
        <h3>Quick Entry Defaults</h3>
        <div className="form">
          <Field label="Default Rate Per Hour (₹)"><input type="number" value={s.rate} onChange={(e) => setS({ ...s, rate: e.target.value })} /></Field>
          <Field label="Default Machine Name (Diesel)"><input value={s.machine} onChange={(e) => setS({ ...s, machine: e.target.value })} /></Field>
        </div>
        <button className="btn primary" onClick={() => { setSettings(s); notify('Settings saved'); }}>Save Settings</button>
      </div>
      <div className="card">
        <h3>Backup & Restore</h3>
        <p className="muted">All data is stored in the server database (SQLite file). Download a backup regularly. Records now: {D.jobs.length} jobs, {D.customers.length} customers, {D.expenses.length + D.diesel.length + D.employee_payments.length} expense entries, {D.invoices.length} invoices.</p>
        <div className="form-actions left"><button className="btn primary" onClick={backup}>⬇ Download Backup</button><button className="btn ghost" onClick={() => file.current.click()}>⬆ Restore from Backup</button></div>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={pick} />
      </div>
      {pending && <Confirm text="Restoring will REPLACE all current data with the backup file. Continue?" onYes={restore} onNo={() => setPending(null)} />}
    </div>
  );
}
