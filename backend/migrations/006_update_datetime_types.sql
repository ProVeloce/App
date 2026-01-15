-- Migration: Update datetime field types
-- This migration updates the type column for datetime fields to use 'datetime' type
-- for proper time picker rendering in the frontend

-- Update maintenance_end_time to datetime type
UPDATE system_config 
SET type = 'datetime', 
    description = 'Estimated end time for maintenance (displayed in IST)'
WHERE category = 'system' AND key = 'maintenance_end_time';

-- Verify the update
SELECT category, key, type, description FROM system_config WHERE key = 'maintenance_end_time';
