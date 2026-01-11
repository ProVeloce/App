-- Unified Tickets Schema per Enterprise Spec
DROP TABLE IF EXISTS tickets;

CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',

    created_by_user_id TEXT NOT NULL,
    created_by_role TEXT NOT NULL,         -- CUSTOMER | EXPERT | ADMIN | SUPERADMIN

    assigned_to_user_id TEXT,              -- nullable
    assigned_to_role TEXT NOT NULL,        -- SUPERADMIN | ADMIN | EXPERT

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_creator ON tickets(created_by_user_id);
CREATE INDEX idx_tickets_role ON tickets(created_by_role);
