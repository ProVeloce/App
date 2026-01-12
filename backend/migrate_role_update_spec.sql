-- Migration: User Role Update Workflow (POML Spec)
-- Maps existing roles and statuses to the new specification.

-- 1. Update Roles
-- user -> viewer
-- expert -> agent
-- others (admin, superadmin) stay same but lowercase just in case
UPDATE users SET role = 'viewer' WHERE role = 'user';
UPDATE users SET role = 'agent' WHERE role = 'expert';
UPDATE users SET role = LOWER(role) WHERE role IN ('admin', 'superadmin');

-- 2. Update Statuses
-- Active -> active
-- Suspended -> suspended
-- Deactivated -> inactive
UPDATE users SET status = 'active' WHERE status IN ('Active', 'active', 'Pending', 'pending');
UPDATE users SET status = 'suspended' WHERE status IN ('Suspended', 'suspended');
UPDATE users SET status = 'inactive' WHERE status IN ('Deactivated', 'deactivated', 'inactive', 'Inactive');

-- 3. Cleanup: Ensure all users fit the new constraints
-- Any role that still doesn't fit the check becomes 'viewer'
UPDATE users SET role = 'viewer' WHERE role NOT IN ('superadmin', 'admin', 'agent', 'viewer');

-- Any status that still doesn't fit becomes 'active'
UPDATE users SET status = 'active' WHERE status NOT IN ('active', 'inactive', 'suspended');

-- 4. Audit Log
-- Record that the migration happened
INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
VALUES (
    'system-migration-' || CURRENT_TIMESTAMP, 
    NULL, 
    'SYSTEM_MIGRATION', 
    'system', 
    'user_role_spec_v2', 
    '{"message": "Migrated users to new role/status spec (v2)"}'
);
