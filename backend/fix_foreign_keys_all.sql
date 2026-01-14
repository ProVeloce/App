-- Comprehensive Foreign Key Fix Migration
-- This script migrates all tables referencing deprecated user tables to point to the active 'users' table.

PRAGMA foreign_keys = OFF;

-- 1. user_profiles
ALTER TABLE user_profiles RENAME TO user_profiles_old;
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  dob TEXT,
  gender TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  pincode TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  full_name TEXT, 
  phone_number TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO user_profiles SELECT * FROM user_profiles_old;
DROP TABLE user_profiles_old;

-- 2. tasks
ALTER TABLE tasks RENAME TO tasks_old;
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  attachments TEXT,
  deadline TIMESTAMP,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assigned_to_id TEXT,
  created_by_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  domain TEXT, 
  price_budget REAL, 
  admin_id TEXT,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);
INSERT INTO tasks SELECT * FROM tasks_old;
DROP TABLE tasks_old;

-- 3. task_submissions
ALTER TABLE task_submissions RENAME TO task_submissions_old;
CREATE TABLE task_submissions (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  expert_id TEXT,
  message TEXT,
  file_urls TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES users(id)
);
INSERT INTO task_submissions SELECT * FROM task_submissions_old;
DROP TABLE task_submissions_old;

-- 4. notifications
ALTER TABLE notifications RENAME TO notifications_old;
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO notifications SELECT * FROM notifications_old;
DROP TABLE notifications_old;

-- 5. refresh_tokens
ALTER TABLE refresh_tokens RENAME TO refresh_tokens_old;
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  token TEXT UNIQUE,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO refresh_tokens SELECT * FROM refresh_tokens_old;
DROP TABLE refresh_tokens_old;

-- 6. activity_logs
ALTER TABLE activity_logs RENAME TO activity_logs_old;
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO activity_logs SELECT * FROM activity_logs_old;
DROP TABLE activity_logs_old;

-- 7. expert_documents
ALTER TABLE expert_documents RENAME TO expert_documents_old;
CREATE TABLE expert_documents (
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
    application_status TEXT DEFAULT 'draft' CHECK (application_status IN ('draft', 'submitted')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO expert_documents SELECT * FROM expert_documents_old;
DROP TABLE expert_documents_old;

-- 8. expert_certifications
ALTER TABLE expert_certifications RENAME TO expert_certifications_old;
CREATE TABLE expert_certifications (
  id TEXT PRIMARY KEY,
  expert_id TEXT NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  credential_id TEXT,
  credential_url TEXT,
  issue_date TEXT NOT NULL,
  expiry_date TEXT,
  file_name TEXT,
  r2_object_key TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO expert_certifications SELECT * FROM expert_certifications_old;
DROP TABLE expert_certifications_old;

-- 9. expert_portfolio
ALTER TABLE expert_portfolio RENAME TO expert_portfolio_old;
CREATE TABLE expert_portfolio (
  id TEXT PRIMARY KEY,
  expert_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  skills TEXT,
  project_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO expert_portfolio SELECT * FROM expert_portfolio_old;
DROP TABLE expert_portfolio_old;

-- 10. expert_portfolio_files
ALTER TABLE expert_portfolio_files RENAME TO expert_portfolio_files_old;
CREATE TABLE expert_portfolio_files (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL,
  expert_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  r2_object_key TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolio_id) REFERENCES expert_portfolio(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO expert_portfolio_files SELECT * FROM expert_portfolio_files_old;
DROP TABLE expert_portfolio_files_old;

-- 11. expert_earnings
ALTER TABLE expert_earnings RENAME TO expert_earnings_old;
CREATE TABLE expert_earnings (
  id TEXT PRIMARY KEY,
  expert_id TEXT NOT NULL,
  task_id TEXT,
  amount REAL NOT NULL DEFAULT 0,
  platform_fee REAL DEFAULT 0,
  net_amount REAL NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  payout_reference TEXT,
  payout_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
INSERT INTO expert_earnings SELECT * FROM expert_earnings_old;
DROP TABLE expert_earnings_old;

-- 12. expert_tasks
ALTER TABLE expert_tasks RENAME TO expert_tasks_old;
CREATE TABLE expert_tasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  expert_id TEXT NOT NULL,
  admin_id TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  UNIQUE(task_id, expert_id)
);
INSERT INTO expert_tasks SELECT * FROM expert_tasks_old;
DROP TABLE expert_tasks_old;

-- 13. payments
ALTER TABLE payments RENAME TO payments_old;
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  expert_id TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'INITIATED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO payments SELECT * FROM payments_old;
DROP TABLE payments_old;

-- 14. tickets_legacy
ALTER TABLE tickets_legacy RENAME TO tickets_legacy_old;
CREATE TABLE tickets_legacy (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  assigned_to_id TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  attachments TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id)
);
INSERT INTO tickets_legacy SELECT * FROM tickets_legacy_old;
DROP TABLE tickets_legacy_old;

-- 15. expert_applications
ALTER TABLE expert_applications RENAME TO expert_applications_old;
CREATE TABLE "expert_applications" (
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected', 'inactive'))
);
INSERT INTO expert_applications SELECT * FROM expert_applications_old;
DROP TABLE expert_applications_old;

-- 16. tickets
ALTER TABLE tickets RENAME TO tickets_old;
CREATE TABLE "tickets" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachment TEXT DEFAULT NULL,
    raised_by_user_id TEXT NOT NULL,
    assigned_user_id TEXT DEFAULT NULL,
    messages JSON NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responder_id TEXT,
    response_text TEXT,
    edit_count INTEGER DEFAULT 0,
    is_edited INTEGER DEFAULT 0,
    org_id TEXT DEFAULT 'ORG-DEFAULT',
    priority TEXT DEFAULT 'medium',
    locked_by TEXT DEFAULT NULL,
    assignee_role TEXT DEFAULT NULL,
    assigned_at TIMESTAMP,
    CONSTRAINT status_check CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    FOREIGN KEY (raised_by_user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);
INSERT INTO tickets SELECT * FROM tickets_old;
DROP TABLE tickets_old;

PRAGMA foreign_keys = ON;
