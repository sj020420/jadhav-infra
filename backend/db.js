import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to backend/.env (local) or the Render environment.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Neon may need a moment to wake up
});
pool.on('error', (e) => console.error('Idle DB client error:', e.message));

// Whitelist of tables (also used to safely build SQL)
export const COLLECTIONS = ['customers', 'jobs', 'expenses', 'diesel', 'employee_payments', 'invoices'];
export default pool;
