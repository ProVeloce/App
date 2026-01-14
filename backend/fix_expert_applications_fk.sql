-- Fix expert_applications foreign key to reference the active users table
-- This is required because the table was not migrated with the other FK fixes

PRAGMA foreign_keys = OFF;

-- 1. Rename the existing table
ALTER TABLE expert_applications RENAME TO expert_applications_old;

-- 2. Create a new table with correct FK reference
CREATE TABLE expert_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' NOT NULL,
  dob TEXT,
  gender TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  pincode TEXT,
  government_id_type TEXT,
  government_id_url TEXT,
  profile_photo_url TEXT,
  domains TEXT,
  years_of_experience INTEGER,
  summary_bio TEXT,
  skills TEXT,
  resume_url TEXT,
  portfolio_urls TEXT,
  certification_urls TEXT,
  working_type TEXT,
  hourly_rate REAL,
  project_rate REAL,
  languages TEXT,
  available_days TEXT,
  available_time_slots TEXT,
  work_preference TEXT,
  communication_mode TEXT,
  terms_accepted INTEGER DEFAULT 0,
  nda_accepted INTEGER DEFAULT 0,
  signature_url TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  internal_notes TEXT,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  org_id TEXT DEFAULT 'ORG-DEFAULT',
  documents TEXT DEFAULT '[]',
  images TEXT DEFAULT '[]',
  profile_phone TEXT DEFAULT '',
  profile_dob TEXT DEFAULT '',
  profile_address TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT status_check CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'inactive', 'revoked'))
);

-- 3. Copy data from old table
INSERT INTO expert_applications SELECT * FROM expert_applications_old;

-- 4. Drop the old table
DROP TABLE expert_applications_old;

PRAGMA foreign_keys = ON;
