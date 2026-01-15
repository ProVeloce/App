-- Migration 005: Add missing task columns for POML Task Assignment
-- This adds assigned_to, due_date, created_by, org_id columns to the tasks table
-- The existing schema uses assigned_to_id/created_by_id, we add the new columns

-- Add assigned_to column (stores expert user ID)
ALTER TABLE tasks ADD COLUMN assigned_to TEXT REFERENCES users(id);

-- Add due_date column
ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP;

-- Add created_by column (stores admin/superadmin user ID who created task)
ALTER TABLE tasks ADD COLUMN created_by TEXT REFERENCES users(id);

-- Add org_id column for multi-tenancy
ALTER TABLE tasks ADD COLUMN org_id TEXT DEFAULT 'ORG-DEFAULT';

-- Copy data from old columns if they exist
UPDATE tasks SET assigned_to = assigned_to_id WHERE assigned_to IS NULL AND assigned_to_id IS NOT NULL;
UPDATE tasks SET created_by = created_by_id WHERE created_by IS NULL AND created_by_id IS NOT NULL;
UPDATE tasks SET due_date = deadline WHERE due_date IS NULL AND deadline IS NOT NULL;

-- Note: Run this migration on your D1 database:
-- wrangler d1 execute proveloce_db --remote --file=./migrations/005_fix_tasks_columns.sql
