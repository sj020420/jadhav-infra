import React, { useState } from 'react';
import { useData } from '../DataContext.jsx';

// Small form helper: state, validation, submit with error toast
export function useForm(initial, validate, onSubmit) {
  const { notify } = useData();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const bind = (k) => ({ value: v[k] ?? '', onChange: (e) => set(k, e.target.value) });
  const submit = async (e) => {
    e.preventDefault();
    const er = validate(v);
    setErr(er);
    if (Object.keys(er).length) { notify(Object.values(er)[0], 'err'); return; }
    setBusy(true);
    try { await onSubmit(v); } catch (x) { notify(x.message, 'err'); } finally { setBusy(false); }
  };
  return { v, set, setV, bind, err, busy, submit };
}

export const FormActions = ({ busy, onCancel, label = 'Save' }) => (
  <div className="form-actions">
    <button type="button" className="btn ghost" onClick={onCancel}>✕ Cancel</button>
    <button type="submit" className="btn primary big" disabled={busy}>{busy ? '⏳ Saving...' : `✓ ${label}`}</button>
  </div>
);

export const num = (x) => (x === '' || x === null || x === undefined ? NaN : Number(x));
