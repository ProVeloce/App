-- Migration: Create expert_documents table for R2 document storage
-- Run this migration in D1 database

CREATE TABLE IF NOT EXISTS expert_documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    application_id TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('profile', 'government_id', 'resume', 'certificate', 'portfolio', 'other')),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    r2_object_key TEXT NOT NULL UNIQUE,
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    rejection_reason TEXT,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expert_documents_user_id ON expert_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_documents_application_id ON expert_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_expert_documents_review_status ON expert_documents(review_status);
CREATE INDEX IF NOT EXISTS idx_expert_documents_document_type ON expert_documents(document_type);
