-- tickets_v3.sql - Fresh table creation
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT UNIQUE,
  title TEXT,
  description TEXT,
  created_by TEXT,
  role TEXT,
  status TEXT,
  priority TEXT,
  category TEXT,
  assigned_to TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TEXT,
  updated_at TEXT
);
