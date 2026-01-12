-- Database migration to add responder and assigned user tracking
ALTER TABLE tickets ADD COLUMN ticket_responder TEXT;
ALTER TABLE tickets ADD COLUMN ticket_assigned_user TEXT;

-- Index for performance on the new columns
CREATE INDEX IF NOT EXISTS idx_tickets_responder ON tickets(ticket_responder);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_user ON tickets(ticket_assigned_user);
