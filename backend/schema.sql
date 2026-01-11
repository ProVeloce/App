-- =====================================================
-- ProVeloce D1 Database Schema
-- =====================================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'customer',
  status TEXT DEFAULT 'pending_verification',
  email_verified INTEGER DEFAULT 0,
  avatar_data TEXT,
  avatar_mime_type TEXT,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- EXPERT APPLICATION FORMS
CREATE TABLE IF NOT EXISTS expert_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  status TEXT DEFAULT 'draft',
  
  -- Personal Details
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
  
  -- Expertise Section
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
  
  -- Availability
  available_days TEXT,
  available_time_slots TEXT,
  work_preference TEXT,
  communication_mode TEXT,
  
  -- Legal
  terms_accepted INTEGER DEFAULT 0,
  nda_accepted INTEGER DEFAULT 0,
  signature_url TEXT,
  
  -- Review
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  internal_notes TEXT,
  
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TASKS FOR EXPERT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS tasks (
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
  FOREIGN KEY (assigned_to_id) REFERENCES users(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- TASK SUBMISSIONS BY EXPERTS
CREATE TABLE IF NOT EXISTS task_submissions (
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

-- SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS tickets (
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

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
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

-- REFRESH TOKENS
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  token TEXT UNIQUE,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
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

-- EXPERT CERTIFICATIONS (stored in R2: expertdetails)
CREATE TABLE IF NOT EXISTS expert_certifications (
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

-- EXPERT PORTFOLIO (stored in R2: expertdetails)
CREATE TABLE IF NOT EXISTS expert_portfolio (
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

-- EXPERT PORTFOLIO FILES (linked to portfolio items)
CREATE TABLE IF NOT EXISTS expert_portfolio_files (
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


-- EXPERT EARNINGS (tracks payments to experts)
CREATE TABLE IF NOT EXISTS expert_earnings (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expert ON expert_certifications(expert_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_expert ON expert_portfolio(expert_id);
CREATE INDEX IF NOT EXISTS idx_earnings_expert ON expert_earnings(expert_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
