-- =====================================================
-- ProVeloce Help Desk Tickets Table - Enterprise Spec
-- Run: npx wrangler d1 execute proveloce_db --file=tickets_enterprise_v2.sql --remote
-- =====================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS tickets;

-- Create tickets table with enterprise specifications
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,  -- Generated ID like PV-TK-20260111-0635
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK(user_role IN ('CUSTOMER', 'EXPERT', 'ADMIN')),
  user_full_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone_number TEXT,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,  -- nullable
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_reply TEXT,  -- nullable
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE UNIQUE INDEX idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);