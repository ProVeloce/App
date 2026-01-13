-- Migration: Ticket Assignment RBAC & Multi-Tenancy (Spec v1.0)
-- -----------------------------------------------------------

-- 1. Update USERS Table
ALTER TABLE users ADD COLUMN org_id TEXT DEFAULT 'ORG-DEFAULT';
ALTER TABLE users ADD COLUMN suspended INTEGER DEFAULT 0;

-- 2. Update TICKETS Table
ALTER TABLE tickets ADD COLUMN org_id TEXT DEFAULT 'ORG-DEFAULT';
ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'medium'; -- low, medium, high, urgent
ALTER TABLE tickets ADD COLUMN locked_by TEXT DEFAULT NULL;
ALTER TABLE tickets ADD COLUMN assignee_role TEXT DEFAULT NULL;

-- 3. Add Indexes for Tenancy Performance
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- 4. Constraint Updates (Note: D1/SQLite doesn't support easy ALTER TABLE constraints, 
-- but we can enforce these in-app and in future schema definitions)

-- Update existing records if any
UPDATE users SET org_id = 'ORG-DEFAULT' WHERE org_id IS NULL;
UPDATE tickets SET org_id = 'ORG-DEFAULT' WHERE org_id IS NULL;
UPDATE tickets SET priority = 'medium' WHERE priority IS NULL;
