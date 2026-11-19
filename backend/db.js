import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Whitelist of tables (also used to safely build SQL)
export const COLLECTIONS = ['customers', 'jobs', 'expenses', 'diesel', 'employee_payments', 'invoices'];

const dbUrl = (process.env.DATABASE_URL || '').trim();
const isPg = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

let pool;

if (isPg) {
  pool = new pg.Pool({
    connectionString: dbUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Neon may need a moment to wake up
  });
  pool.on('error', (e) => console.error('Idle DB client error:', e.message));
} else {
  // Local persistent file-backed database adapter
  const dataDir = path.join(__dirname, 'data');
  const dbFile = path.join(dataDir, 'local-db.json');
  fs.mkdirSync(dataDir, { recursive: true });

  const loadData = () => {
    if (fs.existsSync(dbFile)) {
      try {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      } catch (e) {
        console.error('Error reading local-db.json, reinitializing:', e.message);
      }
    }
    // Auto-seed from existing-data.json if present
    const seedPath = path.join(__dirname, '../database/seed/existing-data.json');
    const store = { seq: 0, tables: {} };
    COLLECTIONS.forEach((c) => { store.tables[c] = []; });

    if (fs.existsSync(seedPath)) {
      try {
        const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8')).data || {};
        COLLECTIONS.forEach((c) => {
          (seed[c] || []).forEach((item) => {
            const { id, createdAt, ...rest } = item;
            store.seq += 1;
            store.tables[c].push({
              seq: store.seq,
              id: id || crypto.randomUUID(),
              date: rest.date || null,
              data: rest,
              created_at: createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          });
        });
        console.log('Seeded local database from database/seed/existing-data.json');
      } catch (err) {
        console.warn('Could not load seed data:', err.message);
      }
    }
    fs.writeFileSync(dbFile, JSON.stringify(store, null, 2), 'utf8');
    return store;
  };

  let store = loadData();
  const saveData = () => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save local database:', e.message);
    }
  };

  const executeLocalQuery = async (sql, params = []) => {
    const s = sql.trim();
    if (/^SELECT\s+1/i.test(s)) {
      return { rows: [{ '?column?': 1 }], rowCount: 1 };
    }

    if (/^BEGIN/i.test(s) || /^COMMIT/i.test(s) || /^ROLLBACK/i.test(s)) {
      return { rows: [], rowCount: 0 };
    }

    // SELECT * FROM c ORDER BY created_at DESC, seq DESC
    const selectAllMatch = /^SELECT\s+\*\s+FROM\s+([a-zA-Z_]+)/i.exec(s);
    if (selectAllMatch && /ORDER\s+BY/i.test(s)) {
      const c = selectAllMatch[1];
      const rows = (store.tables[c] || []).slice().sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        if (da !== db) return db - da;
        return (b.seq || 0) - (a.seq || 0);
      });
      return { rows, rowCount: rows.length };
    }

    // SELECT * FROM c WHERE id = $1
    const selectOneMatch = /^SELECT\s+\*\s+FROM\s+([a-zA-Z_]+)\s+WHERE\s+id\s*=\s*\$1/i.exec(s);
    if (selectOneMatch) {
      const c = selectOneMatch[1];
      const id = params[0];
      const found = (store.tables[c] || []).find((r) => r.id === id);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    // INSERT INTO c (id, date, data, created_at, updated_at) VALUES ($1, $2, $3::jsonb, $4, $5)
    const insertMatch = /^INSERT\s+INTO\s+([a-zA-Z_]+)/i.exec(s);
    if (insertMatch) {
      const c = insertMatch[1];
      if (!store.tables[c]) store.tables[c] = [];
      const [id, date, dataRaw, createdAt, updatedAt] = params;
      let data = dataRaw;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { /* ignore */ }
      }
      store.seq = (store.seq || 0) + 1;
      const row = {
        seq: store.seq,
        id: id || crypto.randomUUID(),
        date: date || null,
        data: data || {},
        created_at: createdAt || new Date().toISOString(),
        updated_at: updatedAt || new Date().toISOString(),
      };
      const idx = store.tables[c].findIndex((r) => r.id === row.id);
      if (idx >= 0) {
        store.tables[c][idx] = row;
      } else {
        store.tables[c].push(row);
      }
      saveData();
      return { rows: [row], rowCount: 1 };
    }

    // UPDATE c SET date = $1, data = $2::jsonb, updated_at = now() WHERE id = $3
    const updateMatch = /^UPDATE\s+([a-zA-Z_]+)/i.exec(s);
    if (updateMatch) {
      const c = updateMatch[1];
      const [date, dataRaw, id] = params;
      let data = dataRaw;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { /* ignore */ }
      }
      const list = store.tables[c] || [];
      const target = list.find((r) => r.id === id);
      if (target) {
        target.date = date || null;
        target.data = data || {};
        target.updated_at = new Date().toISOString();
        saveData();
        return { rows: [target], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // DELETE FROM c WHERE id = $1
    const deleteMatch = /^DELETE\s+FROM\s+([a-zA-Z_]+)\s+WHERE\s+id\s*=\s*\$1/i.exec(s);
    if (deleteMatch) {
      const c = deleteMatch[1];
      const id = params[0];
      const list = store.tables[c] || [];
      const idx = list.findIndex((r) => r.id === id);
      if (idx >= 0) {
        list.splice(idx, 1);
        saveData();
        return { rows: [], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // DELETE FROM c
    const deleteAllMatch = /^DELETE\s+FROM\s+([a-zA-Z_]+)/i.exec(s);
    if (deleteAllMatch) {
      const c = deleteAllMatch[1];
      const count = (store.tables[c] || []).length;
      store.tables[c] = [];
      saveData();
      return { rows: [], rowCount: count };
    }

    console.warn('Unhandled SQL in local db adapter:', s);
    return { rows: [], rowCount: 0 };
  };

  pool = {
    query: executeLocalQuery,
    connect: async () => ({
      query: executeLocalQuery,
      release: () => {},
    }),
    on: () => {},
  };
  console.log(`[Database] Using local persistent file storage at ${dbFile}`);
}

export default pool;
