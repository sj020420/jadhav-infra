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
  if (!url || url === 'local') {
    return {
      connect: async () => {},
      query: async () => ({ rows: [], rowCount: 0 }),
      end: async () => {},
    };
  }
  return new pg.Client({ connectionString: url });
}
export { __dirname };
