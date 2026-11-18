import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import db, { COLLECTIONS, DB_FILE } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const now = () => new Date().toISOString();
const parse = (r) => ({ ...JSON.parse(r.data), id: r.id, createdAt: r.created_at });
const list = (c) => db.prepare(`SELECT * FROM ${c} ORDER BY created_at DESC, rowid DESC`).all().map(parse);
const insert = (c, body) => {
  const { id, createdAt, ...data } = body;
  const nid = id || crypto.randomUUID();
  const t = now();
  db.prepare(`INSERT INTO ${c} (id,date,data,created_at,updated_at) VALUES (?,?,?,?,?)`)
    .run(nid, data.date || null, JSON.stringify(data), createdAt || t, t);
  return nid;
};
const getOne = (c, id) => { const r = db.prepare(`SELECT * FROM ${c} WHERE id=?`).get(id); return r && parse(r); };

app.get('/api/health', (req, res) => res.json({ ok: true, db: path.basename(DB_FILE) }));

// ---- Backup / restore ----
app.get('/api/backup/all', (req, res) => {
  const data = {};
  COLLECTIONS.forEach((c) => (data[c] = list(c)));
  res.json({ app: 'jadhav-infra', exportedAt: now(), data });
});
app.post('/api/backup/restore', (req, res) => {
  const d = req.body && req.body.data;
  if (!d || typeof d !== 'object') return res.status(400).json({ error: 'Invalid backup file' });
  db.transaction(() => {
    COLLECTIONS.forEach((c) => {
      db.prepare(`DELETE FROM ${c}`).run();
      (d[c] || []).forEach((item) => insert(c, item));
    });
  })();
  res.json({ ok: true });
});

// ---- Generic REST CRUD:  /api/:collection ----
app.param('c', (req, res, next, c) =>
  COLLECTIONS.includes(c) ? next() : res.status(404).json({ error: 'Unknown collection' }));

app.get('/api/:c', (req, res) => res.json(list(req.params.c)));
app.post('/api/:c', (req, res) => {
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid data' });
  const id = insert(req.params.c, req.body);
  res.status(201).json(getOne(req.params.c, id));
});
app.put('/api/:c/:id', (req, res) => {
  const { c, id } = req.params;
  if (!getOne(c, id)) return res.status(404).json({ error: 'Record not found' });
  const { id: _i, createdAt, ...data } = req.body;
  db.prepare(`UPDATE ${c} SET date=?, data=?, updated_at=? WHERE id=?`)
    .run(data.date || null, JSON.stringify(data), now(), id);
  res.json(getOne(c, id));
});
app.delete('/api/:c/:id', (req, res) => {
  const r = db.prepare(`DELETE FROM ${req.params.c} WHERE id=?`).run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Record not found' });
  res.status(204).end();
});

// ---- Serve built frontend (production: npm run build && npm start) ----
const dist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`JADHAV INFRA server running on http://localhost:${PORT}  (DB: ${DB_FILE})`));
