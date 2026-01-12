-- Migration: User Management Specification v1.0
-- Aligning roles and statuses

-- 1. Update existing roles
UPDATE users SET role = 'user' WHERE role = 'customer';
UPDATE users SET role = 'admin' WHERE role = 'analyst'; -- Mapping analyst to admin per spec roles if applicable, or keep as is if not in list. Spec only lists 'superadmin','admin','user','expert'.

-- 2. Update existing statuses
UPDATE users SET status = 'Active' WHERE status = 'pending_verification' OR status IS NULL;
UPDATE users SET status = 'Deactivated' WHERE status = 'deactivated';
UPDATE users SET status = 'Suspended' WHERE status = 'suspended';

-- 3. Expert Applications Status mapping
UPDATE expert_applications SET status = 'Pending' WHERE status = 'pending' OR status = 'draft';
UPDATE expert_applications SET status = 'Approved' WHERE status = 'approved';
UPDATE expert_applications SET status = 'Rejected' WHERE status = 'rejected';
UPDATE expert_applications SET status = 'Deactivated' WHERE status = 'deactivated';

-- Note: D1 doesn't support adding CHECK constraints via ALTER TABLE easily. 
-- We will enforce these in the backend code and update the schema.sql for future initializations.
