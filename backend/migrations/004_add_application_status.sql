-- Migration: Add application_status to expert_documents for draft/submit workflow
-- Run this migration in D1 database

-- Add application_status column to track draft vs submitted
ALTER TABLE expert_documents ADD COLUMN application_status TEXT DEFAULT 'draft' CHECK (application_status IN ('draft', 'submitted'));

-- Create index for filtering by application status
CREATE INDEX IF NOT EXISTS idx_expert_documents_application_status ON expert_documents(application_status);
