-- Add missing ticket_number column to tickets table
ALTER TABLE tickets ADD COLUMN ticket_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
