-- Migration 006: Fix Task Assignment Schema
-- Ensures assigned_to column exists and has proper foreign key to users table

-- Step 1: Add assigned_to column if it doesn't exist
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we use a workaround
-- This migration should be run with error handling - if column exists, it will error and that's OK

-- Try adding new columns (run each separately, ignore errors if column exists)
-- ALTER TABLE tasks ADD COLUMN assigned_to TEXT REFERENCES users(id);
-- ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP;
-- ALTER TABLE tasks ADD COLUMN created_by TEXT REFERENCES users(id);
-- ALTER TABLE tasks ADD COLUMN org_id TEXT DEFAULT 'ORG-DEFAULT';

-- Step 2: Copy data from old columns to new columns
UPDATE tasks SET assigned_to = assigned_to_id WHERE assigned_to IS NULL AND assigned_to_id IS NOT NULL;
UPDATE tasks SET created_by = created_by_id WHERE created_by IS NULL AND created_by_id IS NOT NULL;
UPDATE tasks SET due_date = deadline WHERE due_date IS NULL AND deadline IS NOT NULL;

-- Step 3: Create index for faster lookups
-- CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
-- CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON tasks(assigned_to_id);

-- Verification query (run to verify data):
-- SELECT t.id, t.title, t.assigned_to, t.assigned_to_id, u.name as expert_name
-- FROM tasks t
-- LEFT JOIN users u ON COALESCE(t.assigned_to, t.assigned_to_id) = u.id
-- WHERE t.assigned_to IS NOT NULL OR t.assigned_to_id IS NOT NULL;

-- Note: Run individual ALTER TABLE commands manually if needed:
-- wrangler d1 execute proveloce_db --remote --command="ALTER TABLE tasks ADD COLUMN assigned_to TEXT"
-- wrangler d1 execute proveloce_db --remote --command="ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP"
-- wrangler d1 execute proveloce_db --remote --command="ALTER TABLE tasks ADD COLUMN created_by TEXT"
-- wrangler d1 execute proveloce_db --remote --command="ALTER TABLE tasks ADD COLUMN org_id TEXT DEFAULT 'ORG-DEFAULT'"
