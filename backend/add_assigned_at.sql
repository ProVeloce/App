-- Add assigned_at column to tickets table
-- Run: npx wrangler d1 execute proveloce_db --file=add_assigned_at.sql --remote

ALTER TABLE tickets ADD COLUMN assigned_at TIMESTAMP;
