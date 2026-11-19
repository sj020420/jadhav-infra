import { clearToken, getToken, LOGOUT_EVENT } from './auth.js';

// ===== DATA SERVICE (the only place that talks to the backend) =====
// Backend: Express + PostgreSQL (Neon)  ->  REST  /api/:collection
// VITE_API_URL = backend address (e.g. https://xxxx.onrender.com). Empty = same origin (/api via dev proxy).
const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const BASE = raw ? (raw.endsWith('/api') ? raw : `${raw}/api`) : '/api';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Render's free plan puts the server to sleep when idle; the first request can take up to ~1 minute.
// Reads (GET) are retried so the app simply waits for the server to wake up.
async function req(path, opts = {}) {
  const isRead = !opts.method || opts.method === 'GET' || path === '/login'; // safe to repeat
  const tries = isRead ? 10 : 1;
  let lastErr;
  for (let i = 0; i < tries; i += 1) {
    let res;
    try {
      const headers = { 'Content-Type': 'application/json' };
      const tk = getToken();
      if (tk) headers.Authorization = `Bearer ${tk}`;
      res = await fetch(BASE + path, { ...opts, headers });
    } catch {
      lastErr = new Error('Cannot reach the server. Please make sure the backend is running.');
      if (i < tries - 1) { await sleep(5000); continue; }
      throw lastErr;
    }
    if (isRead && [502, 503, 504].includes(res.status) && i < tries - 1) { await sleep(5000); continue; }
    if (res.status === 401 && path !== '/login') { // token missing / expired -> back to login screen
      clearToken();
      window.dispatchEvent(new Event(LOGOUT_EVENT));
    }
    if (!res.ok) {
      let msg = 'Request failed';
      try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }
  throw lastErr;
}

export const api = {
  login: (username, password) => req('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  list: (c) => req(`/${c}`),
  create: (c, d) => req(`/${c}`, { method: 'POST', body: JSON.stringify(d) }),
  update: (c, id, d) => req(`/${c}/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (c, id) => req(`/${c}/${id}`, { method: 'DELETE' }),
  backup: () => req('/backup/all'),
  restore: (d) => req('/backup/restore', { method: 'POST', body: JSON.stringify(d) }),
};
