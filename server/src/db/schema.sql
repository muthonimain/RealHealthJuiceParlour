-- Real Health Juice Parlour POS schema

CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📋',
  color TEXT NOT NULL,
  light_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  sections JSONB
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INT NOT NULL DEFAULT 0,
  note TEXT,
  section TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL DEFAULT '',
  employee_name TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal INT NOT NULL,
  delivery_included BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_amount INT NOT NULL DEFAULT 0,
  packaging_amount INT NOT NULL DEFAULT 0,
  include_paybill BOOLEAN NOT NULL DEFAULT FALSE,
  grand_total INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Sequential order numbers per year (RHJP26-0001, RHJP26-0002, …)
CREATE TABLE IF NOT EXISTS order_number_seq (
  year_suffix CHAR(2) PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date_key DATE NOT NULL,
  description TEXT NOT NULL,
  amount INT NOT NULL,
  recorded_by_id TEXT NOT NULL,
  recorded_by_name TEXT NOT NULL,
  recorded_by_role TEXT NOT NULL CHECK (recorded_by_role IN ('owner', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date_key ON expenses(date_key DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS clearances (
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  date_key DATE NOT NULL,
  cleared_at TIMESTAMPTZ NOT NULL,
  cleared_by TEXT NOT NULL,
  PRIMARY KEY (employee_id, date_key)
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_username_lower ON employees (LOWER(username));
