import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATABASE_URL can come from the environment, database/.env or backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Put it in database/.env (see .env.example).');
    process.exit(1);
  }
  return new pg.Client({ connectionString: url });
}
export { __dirname };
