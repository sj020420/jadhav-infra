import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { enrichJob } from './calc.js';

const COLS = ['customers', 'jobs', 'expenses', 'diesel', 'employee_payments', 'invoices'];
const empty = Object.fromEntries(COLS.map((c) => [c, []]));
const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

export function DataProvider({ children }) {
  const [raw, setRaw] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Promise.all(COLS.map((c) => api.list(c)));
      setRaw(Object.fromEntries(COLS.map((c, i) => [c, res[i]])));
      setError(null);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (msg, type = 'ok') => setToast({ msg, type, k: Date.now() });
  const save = async (c, item) => {
    const saved = item.id ? await api.update(c, item.id, item) : await api.create(c, item);
    setRaw((d) => ({ ...d, [c]: item.id ? d[c].map((x) => (x.id === saved.id ? saved : x)) : [saved, ...d[c]] }));
    return saved;
  };
  const remove = async (c, id) => {
    await api.remove(c, id);
    setRaw((d) => ({ ...d, [c]: d[c].filter((x) => x.id !== id) }));
  };

  const D = useMemo(() => ({ ...raw, jobs: raw.jobs.map(enrichJob) }), [raw]);
  return (
    <Ctx.Provider value={{ D, save, remove, notify, loading, error, reload: load }}>
      {children}
      {toast && <div key={toast.k} className={`toast ${toast.type}`}>{toast.type === 'ok' ? '✅ ' : '⚠️ '}{toast.msg}</div>}
    </Ctx.Provider>
  );
}
