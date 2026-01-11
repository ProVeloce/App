-- =====================================================
-- ProVeloce HelpDesk Migration v1.1
-- To run: npx wrangler d1 execute proveloce_db --file=helpdesk_v1.1.sql --remote
-- =====================================================

-- Add new columns to expert_helpdesk table (without UNIQUE - will add as index)
ALTER TABLE expert_helpdesk ADD COLUMN ticket_number TEXT;
ALTER TABLE expert_helpdesk ADD COLUMN created_by_role TEXT;
ALTER TABLE expert_helpdesk ADD COLUMN contact_name TEXT;
ALTER TABLE expert_helpdesk ADD COLUMN contact_email TEXT;
ALTER TABLE expert_helpdesk ADD COLUMN contact_phone TEXT;

-- Create ticket_events table for audit trail
CREATE TABLE IF NOT EXISTS ticket_events (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  ticket_number TEXT,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES expert_helpdesk(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

-- Create indexes (unique index for ticket_number)
CREATE UNIQUE INDEX IF NOT EXISTS idx_helpdesk_ticket_number ON expert_helpdesk(ticket_number);
CREATE INDEX IF NOT EXISTS idx_helpdesk_created_by_role ON expert_helpdesk(created_by_role);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON ticket_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_number ON ticket_events(ticket_number);
