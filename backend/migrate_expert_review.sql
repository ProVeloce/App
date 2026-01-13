-- Migration: Expert Application Review RBAC (Spec v2.0)
-- -----------------------------------------------------

-- 1. Update EXPERT_APPLICATIONS Table
ALTER TABLE expert_applications ADD COLUMN org_id TEXT DEFAULT 'ORG-DEFAULT';
ALTER TABLE expert_applications ADD COLUMN documents TEXT DEFAULT '[]'; -- Stores JSON metadata
ALTER TABLE expert_applications ADD COLUMN images TEXT DEFAULT '[]';    -- Stores JSON metadata

-- 2. Add Indexes
CREATE INDEX IF NOT EXISTS idx_expert_apps_org_id ON expert_applications(org_id);
CREATE INDEX IF NOT EXISTS idx_expert_apps_status ON expert_applications(status);

-- 3. Data Integrity
UPDATE expert_applications SET org_id = 'ORG-DEFAULT' WHERE org_id IS NULL;
UPDATE expert_applications SET documents = '[]' WHERE documents IS NULL;
UPDATE expert_applications SET images = '[]' WHERE images IS NULL;
