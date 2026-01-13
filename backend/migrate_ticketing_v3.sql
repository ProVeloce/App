-- Migration: Unified Ticketing System (Spec v3.0)
-- -----------------------------------------------------

-- 1. Create ticket_files table
CREATE TABLE IF NOT EXISTS ticket_files (
    id TEXT PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    filetype TEXT NOT NULL,
    bucket TEXT DEFAULT 'others',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- 2. Update status constraint for tickets by recreating the table
PRAGMA foreign_keys=OFF;

CREATE TABLE tickets_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    ticket_number TEXT UNIQUE NOT NULL, 
    category TEXT NOT NULL, 
    subject TEXT NOT NULL, 
    description TEXT NOT NULL, 
    attachment TEXT DEFAULT NULL, 
    raised_by_user_id TEXT NOT NULL, 
    assigned_user_id TEXT DEFAULT NULL, 
    messages JSON NOT NULL DEFAULT '[]', 
    status TEXT NOT NULL DEFAULT 'Open', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    responder_id TEXT, 
    response_text TEXT, 
    edit_count INTEGER DEFAULT 0, 
    is_edited INTEGER DEFAULT 0, 
    org_id TEXT DEFAULT 'ORG-DEFAULT', 
    priority TEXT DEFAULT 'medium', 
    locked_by TEXT DEFAULT NULL, 
    assignee_role TEXT DEFAULT NULL, 
    CONSTRAINT status_check CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')), 
    FOREIGN KEY (raised_by_user_id) REFERENCES users(id), 
    FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    FOREIGN KEY (responder_id) REFERENCES users(id)
);

-- Copy data
INSERT INTO tickets_new (
    id, ticket_number, category, subject, description, attachment, 
    raised_by_user_id, assigned_user_id, messages, status, 
    created_at, updated_at, responder_id, response_text, 
    edit_count, is_edited, org_id, priority, locked_by, assignee_role
)
SELECT 
    id, ticket_number, category, subject, description, attachment, 
    raised_by_user_id, assigned_user_id, messages, status, 
    created_at, updated_at, responder_id, response_text, 
    edit_count, is_edited, org_id, priority, locked_by, assignee_role
FROM tickets;

DROP TABLE tickets;
ALTER TABLE tickets_new RENAME TO tickets;

PRAGMA foreign_keys=ON;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_files_ticket_id ON ticket_files(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_raised_by ON tickets(raised_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id);
