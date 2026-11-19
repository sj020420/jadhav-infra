import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import pool, { COLLECTIONS } from './db.js';
import { login, requireAuth } from './auth.js';

const app = express();
const PORT = process.env.PORT || 5001;
app.set('trust proxy', 1); // Render sits behind a proxy (needed for correct client IP)

// ---- CORS: only the configured frontend(s) may call the API in production ----
const allowed = (process.env.FRONTEND_URL || '')
  .split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
app.use(cors({
  origin: allowed.length ? allowed : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '25mb' }));

const now = () => new Date().toISOString();
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const parse = (r) => ({ ...r.data, id: r.id, createdAt: new Date(r.created_at).toISOString() });

const list = async (c, db = pool) =>
  (await db.query(`SELECT * FROM ${c} ORDER BY created_at DESC, seq DESC`)).rows.map(parse);
const getOne = async (c, id, db = pool) => {
  const { rows } = await db.query(`SELECT * FROM ${c} WHERE id = $1`, [id]);
  return rows[0] && parse(rows[0]);
};
const insert = async (c, body, db = pool) => {
  const { id, createdAt, ...data } = body;
  const nid = id || crypto.randomUUID();
  const t = now();
  await db.query(
    `INSERT INTO ${c} (id, date, data, created_at, updated_at) VALUES ($1, $2, $3::jsonb, $4, $5)`,
    [nid, data.date || null, JSON.stringify(data), createdAt || t, t],
  );
  return nid;
};

app.get('/', (req, res) => res.json({ app: 'jadhav-infra-backend', ok: true }));
app.get('/api/health', h(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, db: 'postgres' });
}));

// ---- Login (public) ; everything below /api requires a valid token ----
app.post('/api/login', login);
app.use('/api', requireAuth);

// ---- Backup / restore ----
app.get('/api/backup/all', h(async (req, res) => {
  const data = {};
  for (const c of COLLECTIONS) data[c] = await list(c);
  res.json({ app: 'jadhav-infra', exportedAt: now(), data });
}));
app.post('/api/backup/restore', h(async (req, res) => {
  const d = req.body && req.body.data;
  if (!d || typeof d !== 'object') return res.status(400).json({ error: 'Invalid backup file' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const c of COLLECTIONS) {
      await client.query(`DELETE FROM ${c}`);
      for (const item of d[c] || []) await insert(c, item, client);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  res.json({ ok: true });
}));

// ---- Generic REST CRUD:  /api/:collection ----
app.param('c', (req, res, next, c) =>
  COLLECTIONS.includes(c) ? next() : res.status(404).json({ error: 'Unknown collection' }));

app.get('/api/:c', h(async (req, res) => res.json(await list(req.params.c))));
app.get('/api/:c/:id', h(async (req, res) => {
  const r = await getOne(req.params.c, req.params.id);
  if (!r) return res.status(404).json({ error: 'Record not found' });
  res.json(r);
}));
app.post('/api/:c', h(async (req, res) => {
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid data' });
  const id = await insert(req.params.c, req.body);
  res.status(201).json(await getOne(req.params.c, id));
}));
app.put('/api/:c/:id', h(async (req, res) => {
  const { c, id } = req.params;
  if (!(await getOne(c, id))) return res.status(404).json({ error: 'Record not found' });
  const { id: _i, createdAt, ...data } = req.body;
  await pool.query(
    `UPDATE ${c} SET date = $1, data = $2::jsonb, updated_at = now() WHERE id = $3`,
    [data.date || null, JSON.stringify(data), id],
  );
  res.json(await getOne(c, id));
}));
app.delete('/api/:c/:id', h(async (req, res) => {
  const r = await pool.query(`DELETE FROM ${req.params.c} WHERE id = $1`, [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'Record not found' });
  res.status(204).end();
}));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`JADHAV INFRA API running on port ${PORT}`));
