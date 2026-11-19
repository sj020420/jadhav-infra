// Imports records from a backup JSON file into the database.
//   npm run import                      -> seed/existing-data.json (your old SQLite data)
//   npm run import -- path/to/file.json -> any backup downloaded from Settings -> Download Backup
// Existing records with the same id are left untouched, so it is safe to re-run.
import fs from 'fs';
import path from 'path';
import { connect, __dirname } from './connect.js';

const COLLECTIONS = ['customers', 'jobs', 'expenses', 'diesel', 'employee_payments', 'invoices'];
const file = path.resolve(process.argv[2] || path.join(__dirname, 'seed/existing-data.json'));
const data = JSON.parse(fs.readFileSync(file, 'utf8')).data || {};

const client = connect();
try {
  await client.connect();
  await client.query('BEGIN');
  for (const c of COLLECTIONS) {
    let n = 0;
    for (const item of data[c] || []) {
      const { id, createdAt, ...rest } = item;
      const r = await client.query(
        `INSERT INTO ${c} (id, date, data, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, now()), now())
         ON CONFLICT (id) DO NOTHING`,
        [id, rest.date || null, JSON.stringify(rest), createdAt || null],
      );
      n += r.rowCount;
    }
    console.log(`${c}: ${n} imported`);
  }
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('Import failed:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
