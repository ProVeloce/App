-- Migration: Add System & Maintenance Configuration
-- This migration adds system-level configurations for maintenance mode
-- These configs are applied globally and checked by frontend on every session load

-- Insert system maintenance configurations (ignore if already exists)
INSERT OR IGNORE INTO system_config (id, category, key, value, type, label, description, updated_at)
VALUES 
    (lower(hex(randomblob(16))), 'system', 'maintenance_mode', 'false', 'boolean', 'Maintenance Mode', 'Enable to show maintenance page to customers and experts', datetime('now')),
    (lower(hex(randomblob(16))), 'system', 'maintenance_message', 'System is currently under maintenance. Please check back later.', 'string', 'Maintenance Message', 'Custom message displayed on maintenance page', datetime('now')),
    (lower(hex(randomblob(16))), 'system', 'maintenance_end_time', '', 'string', 'Maintenance End Time', 'Estimated end time (ISO format, e.g., 2026-01-15T18:00:00Z)', datetime('now'));

-- Remove duplicate maintenance_mode from features category if exists
DELETE FROM system_config WHERE category = 'features' AND key = 'maintenance_mode';

-- Verify the system configs are in place
SELECT category, key, value, label FROM system_config WHERE category = 'system' ORDER BY key;
