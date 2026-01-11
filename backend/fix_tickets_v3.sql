-- Add only truly missing columns (title was the error)
-- Skip: description (exists), ticket_number (added)
ALTER TABLE tickets ADD COLUMN title TEXT;
ALTER TABLE tickets ADD COLUMN created_by TEXT;
ALTER TABLE tickets ADD COLUMN role TEXT;
ALTER TABLE tickets ADD COLUMN status TEXT DEFAULT 'open';
ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'normal';
ALTER TABLE tickets ADD COLUMN category TEXT;
ALTER TABLE tickets ADD COLUMN assigned_to TEXT;
ALTER TABLE tickets ADD COLUMN contact_name TEXT;
ALTER TABLE tickets ADD COLUMN contact_email TEXT;
ALTER TABLE tickets ADD COLUMN contact_phone TEXT;
ALTER TABLE tickets ADD COLUMN updated_at TEXT;
