-- Migration: Unified Ticket Specification (Repair & Migration)
-- Standardizes the 'tickets' table to Spec v3.0 while maintaining system compatibility.

-- 1. Create a standardized temporary table
CREATE TABLE IF NOT EXISTS tickets_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,                       -- String ID for backend (PV-TK-...)
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachment TEXT DEFAULT NULL,                             -- R2 object key
    raised_by_user_id TEXT NOT NULL,                         -- FK → users.id
    assigned_user_id TEXT DEFAULT NULL,                      -- FK → users.id
    messages JSON NOT NULL DEFAULT '[]',                      -- Array of {sender_id, text, timestamp}
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT status_check CHECK (status IN ('Open', 'In Progress', 'Closed')),
    FOREIGN KEY (raised_by_user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

-- 2. Migrate from 'tickets' (if it exists and has the old structure)
-- We try to detect if 'tickets' has a 'ticket_number' column. 
-- Since D1/SQLite doesn't support IF EXISTS for column checks in a simple script, 
-- we'll perform a best-effort migration.

-- If 'tickets' already contains 'ticket_number', it's already updated.
-- If not, we migrate 'id' (as string) to 'ticket_number'.
INSERT INTO tickets_new (ticket_number, category, subject, description, attachment, raised_by_user_id, assigned_user_id, status, created_at, updated_at)
SELECT 
    CAST(id AS TEXT), category, subject, description, attachment, raised_by_user_id, assigned_user_id, status, created_at, updated_at
FROM tickets 
WHERE (SELECT count(*) FROM sqlite_master WHERE name='tickets' AND (sql LIKE '%ticket_number%' OR sql LIKE '%raised_by_user_id%')) > 0;

-- 3. Cleanup and SWAP
-- Move current tickets to backup if they exist
DROP TABLE IF EXISTS tickets_v2_backup;
ALTER TABLE tickets RENAME TO tickets_v2_backup;
ALTER TABLE tickets_new RENAME TO tickets;

-- 4. Re-create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_raised_by ON tickets(raised_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
