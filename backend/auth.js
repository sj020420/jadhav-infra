import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const USER = process.env.ADMIN_USERNAME;
const PASS = process.env.ADMIN_PASSWORD;
if (!USER || !PASS) {
  console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set (backend/.env locally, Render Environment in production).');
  process.exit(1);
}
let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  SECRET = crypto.randomBytes(32).toString('hex'); // fine locally; users must log in again after a restart
  console.warn('JWT_SECRET not set - using a temporary one (logins reset on every restart). Set JWT_SECRET in production.');
}
const EXPIRES = '30d';

// compare without leaking length/timing information
const safeEq = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// ---- very small in-memory brute-force protection: 10 failed logins / 15 min / IP ----
const fails = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 10;
const tooMany = (ip) => {
  const e = fails.get(ip);
  if (!e) return false;
  if (Date.now() - e.first > WINDOW) { fails.delete(ip); return false; }
  return e.n >= MAX_FAILS;
};
const noteFail = (ip) => {
  const e = fails.get(ip);
  if (!e || Date.now() - e.first > WINDOW) fails.set(ip, { n: 1, first: Date.now() });
  else e.n += 1;
};

export function login(req, res) {
  const ip = req.ip;
  if (tooMany(ip)) return res.status(429).json({ error: 'Too many attempts. Try again after 15 minutes.' });
  const { username, password } = req.body || {};
  // evaluate both so timing is the same whichever is wrong
  const okUser = safeEq(username ?? '', USER);
  const okPass = safeEq(password ?? '', PASS);
  if (!(okUser && okPass)) {
    noteFail(ip);
    return res.status(401).json({ error: 'Wrong username or password' });
  }
  fails.delete(ip);
  const token = jwt.sign({ sub: USER }, SECRET, { expiresIn: EXPIRES });
  res.json({ token, username: USER });
}

export function requireAuth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return res.status(401).json({ error: 'Please log in' });
  try {
    jwt.verify(m[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}
