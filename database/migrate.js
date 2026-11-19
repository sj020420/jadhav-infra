// Creates all tables in the database (safe to run any number of times).
import fs from 'fs';
import path from 'path';
import { connect, __dirname } from './connect.js';

const client = connect();
try {
  await client.connect();
  await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  console.log('Database ready: tables created / already present.');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
