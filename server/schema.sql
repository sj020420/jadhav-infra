-- JADHAV INFRA database schema (SQLite)
-- Each table stores one record per row. Searchable columns are kept
-- separate (id, date) and the full record is stored as JSON in `data`.
-- To move to MySQL/PostgreSQL later, keep the same columns (JSON type for `data`).

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, date TEXT, data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS jobs (            -- JCB work records (incl. payments[])
  id TEXT PRIMARY KEY, date TEXT, data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY, date TEXT, data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS diesel (
  id TEXT PRIMARY KEY, date TEXT, data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS employee_payments (
  id TEXT PRIMARY KEY, date TEXT, data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, date TEXT, data TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_diesel_date ON diesel(date);
CREATE INDEX IF NOT EXISTS idx_emp_date ON employee_payments(date);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
