-- Add specialized response tracking columns for Spec v4.0
ALTER TABLE tickets ADD COLUMN responder_id TEXT REFERENCES users(id);
ALTER TABLE tickets ADD COLUMN response_text TEXT;
ALTER TABLE tickets ADD COLUMN edit_count INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN is_edited INTEGER DEFAULT 0;

-- Optional: Migrate the latest admin/expert message to response_text for existing tickets
-- This allows existing data to show up in the new simplified view.
-- Note: SQLite's JSON support in D1 is a bit limited in ALTER scripts, 
-- but we can attempt to populate responder_id/response_text for active tickets.
-- For now, we'll leave them NULL and let new responses populate them.
