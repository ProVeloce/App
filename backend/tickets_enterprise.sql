-- Drop and recreate tickets table with proper schema
DROP TABLE IF EXISTS tickets;

CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT UNIQUE NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  assigned_to_role TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_created_by ON tickets(created_by_user_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_role);
CREATE INDEX idx_tickets_status ON tickets(status);
