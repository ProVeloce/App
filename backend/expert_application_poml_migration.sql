-- Migration for Expert Application POML 1.0
-- Adding specified fields to expert_applications and expert_documents

-- 1. Update expert_applications table
ALTER TABLE expert_applications ADD COLUMN profile_phone TEXT DEFAULT '';
ALTER TABLE expert_applications ADD COLUMN profile_dob TEXT DEFAULT '';
ALTER TABLE expert_applications ADD COLUMN profile_address TEXT DEFAULT '';

-- 2. Update expert_documents table
ALTER TABLE expert_documents ADD COLUMN r2_url TEXT;

-- 3. Verify changes
PRAGMA table_info(expert_applications);
PRAGMA table_info(expert_documents);
