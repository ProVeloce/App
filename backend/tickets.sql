-- =====================================================
-- ProVeloce Unified Tickets Table
-- Run: npx wrangler d1 execute proveloce_db --file=tickets.sql --remote
-- =====================================================

-- Create unified tickets table FIRST
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by TEXT NOT NULL,
  role TEXT CHECK(role IN ('user','expert','admin','superadmin')) NOT NULL,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  category TEXT,
  assigned_to TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

-- Create indexes for tickets
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_role ON tickets(role);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
