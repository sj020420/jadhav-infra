// ===== Formatting, time and date helpers =====
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const pinr = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); // PDF-safe
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toISO(new Date());
export const fmtDate = (d) => { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
export const fmt12 = (t) => {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ap}`;
};
// Hours between start and end. If end is earlier than start the job ran past midnight.
export const calcHours = (s, e) => {
  if (!s || !e) return 0;
  const [a, b] = s.split(':').map(Number);
  const [c, d] = e.split(':').map(Number);
  let mins = c * 60 + d - (a * 60 + b);
  if (mins < 0) mins += 1440;
  return round2(mins / 60);
};
export const crossesMidnight = (s, e) => !!(s && e && e < s);
export const validMobile = (m) => /^[6-9]\d{9}$/.test(m);

export function getRange({ preset, from, to }) {
  const n = new Date();
  switch (preset) {
    case 'today': return [today(), today()];
    case 'yesterday': { const y = new Date(n); y.setDate(n.getDate() - 1); return [toISO(y), toISO(y)]; }
    case 'week': {
      const s = new Date(n); s.setDate(n.getDate() - ((n.getDay() + 6) % 7));
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return [toISO(s), toISO(e)];
    }
    case 'month': return [toISO(new Date(n.getFullYear(), n.getMonth(), 1)), toISO(new Date(n.getFullYear(), n.getMonth() + 1, 0))];
    case 'custom': return [from || '', to || ''];
    default: return ['', ''];
  }
}
export const inRange = (date, r) => { const [f, t] = getRange(r); return (!f || date >= f) && (!t || date <= t); };
export const rangeText = (r) => {
  const [f, t] = getRange(r);
  return f || t ? `${f ? fmtDate(f) : 'Start'} to ${t ? fmtDate(t) : 'Today'}` : 'All dates';
};
export const fyOf = (date) => {
  const [y, m] = date.split('-').map(Number);
  const s = m >= 4 ? y : y - 1;
  return `${s}-${String(s + 1).slice(2)}`;
};

// Table cell helpers (shared by tables and exports)
export const cellVal = (c, r) => (c.val ? c.val(r) : r[c.key]);
export const disp = (c, r) => {
  const v = cellVal(c, r);
  if (v === null || v === undefined || v === '') return '';
  if (c.type === 'money') return inr(v);
  if (c.type === 'date') return fmtDate(v);
  if (c.type === 'time') return fmt12(v);
  return String(v);
};
export const expVal = (c, r, pdf = false) => {
  const v = cellVal(c, r);
  if (v === null || v === undefined || v === '') return '';
  if (c.type === 'money') return pdf ? pinr(v) : Number(v);
  if (c.type === 'date') return fmtDate(v);
  if (c.type === 'time') return fmt12(v);
  return v;
};

// In-memory runtime session defaults only (No browser persistence in localStorage/sessionStorage/cookies)
let _last = {};
let _settings = { rate: '', machine: 'JCB' };

export const getLast = () => ({ ..._last });
export const setLast = (v) => { _last = { ..._last, ...v }; };
export const getSettings = () => ({ ..._settings });
export const setSettings = (v) => { _settings = { ..._settings, ...v }; };

