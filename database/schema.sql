-- JADHAV INFRA database schema (PostgreSQL / Neon)
-- Each table stores one record per row. `id` and `date` are real columns,
-- the full record is kept as JSONB in `data`.
-- Safe to run many times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS customers (
  seq        BIGSERIAL,
  id         TEXT PRIMARY KEY,
  date       TEXT,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (            -- JCB work records (incl. payments[])
  seq        BIGSERIAL,
  id         TEXT PRIMARY KEY,
  date       TEXT,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  seq        BIGSERIAL,
  id         TEXT PRIMARY KEY,
  date       TEXT,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diesel (
  seq        BIGSERIAL,
  id         TEXT PRIMARY KEY,
  date       TEXT,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_payments (
  seq        BIGSERIAL,
  id         TEXT PRIMARY KEY,
  date       TEXT,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  seq        BIGSERIAL,
  id         TEXT PRIMARY KEY,
  date       TEXT,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC, seq DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_date         ON jobs(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_diesel_date       ON diesel(date);
CREATE INDEX IF NOT EXISTS idx_emp_date          ON employee_payments(date);
CREATE INDEX IF NOT EXISTS idx_invoices_date     ON invoices(date);
