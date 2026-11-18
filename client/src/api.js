// ===== DATA SERVICE (the only place that talks to the backend) =====
// Backend: Express + SQLite  ->  REST  /api/:collection
const BASE = import.meta.env.VITE_API_URL || '/api';

async function req(path, opts = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  } catch {
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }
  if (!res.ok) {
    let msg = 'Request failed';
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  list: (c) => req(`/${c}`),
  create: (c, d) => req(`/${c}`, { method: 'POST', body: JSON.stringify(d) }),
  update: (c, id, d) => req(`/${c}/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (c, id) => req(`/${c}/${id}`, { method: 'DELETE' }),
  backup: () => req('/backup/all'),
  restore: (d) => req('/backup/restore', { method: 'POST', body: JSON.stringify(d) }),
};
