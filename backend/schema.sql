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
  role TEXT DEFAULT 'Customer' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  email_verified INTEGER DEFAULT 0,
  avatar_data TEXT,
  avatar_mime_type TEXT,
  -- Expert profile fields
  location TEXT,
  verified INTEGER DEFAULT 0,
  rating REAL,
  skills TEXT,                 -- JSON array: ["React","MongoDB","Billing",...]
  domains TEXT,                -- JSON array: ["Billing","Infra","Security",...]
  availability TEXT,           -- JSON object: {status:"Available", slots:[...]}
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT role_check CHECK (role IN ('superadmin', 'admin', 'Expert', 'Customer')),
  CONSTRAINT status_check CHECK (status IN ('active', 'inactive', 'suspended'))
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
  status TEXT DEFAULT 'Pending' NOT NULL,
  
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected', 'inactive'))
);

-- TASKS FOR EXPERT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  attachments TEXT,
  deadline TIMESTAMP,
  price_budget REAL,
  status TEXT DEFAULT 'PENDING',       -- PENDING/IN_PROGRESS/COMPLETED/CANCELLED
  priority TEXT DEFAULT 'MEDIUM',      -- LOW/MEDIUM/HIGH
  admin_id TEXT,                       -- Admin who created the task
  created_by_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- EXPERT TASK ASSIGNMENTS (many-to-many: one task can be assigned to multiple experts)
CREATE TABLE IF NOT EXISTS expert_tasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  expert_id TEXT NOT NULL,
  admin_id TEXT,
  status TEXT DEFAULT 'PENDING',       -- PENDING/VIEWED/ACCEPTED/DECLINED/IN_PROGRESS/COMPLETED/PAYMENT_DUE/PAID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  UNIQUE(task_id, expert_id)
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

-- SUPPORT TICKETS (LEGACY - DEPRECATED)
CREATE TABLE IF NOT EXISTS tickets_legacy (
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

-- UNIFIED TICKETS (SPEC v3.0)
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachment TEXT DEFAULT NULL,                             -- R2 object key
    raised_by_user_id TEXT NOT NULL,                         -- FK → users.id
    assigned_user_id TEXT DEFAULT NULL,                      -- FK → users.id
    messages JSON NOT NULL DEFAULT '[]',                      -- Array of {sender_id, text, timestamp}
    status TEXT NOT NULL DEFAULT 'Open',
    -- Response Workflow (Spec v4.0)
    responder_id TEXT DEFAULT NULL,                           -- User ID of the single responder
    response_text TEXT DEFAULT NULL,                          -- The single consolidated response
    edit_count INTEGER DEFAULT 0,                             -- Number of times edited (limit: 1)
    is_edited INTEGER DEFAULT 0,                              -- 1 if edited, 0 otherwise
    assigned_at TIMESTAMP DEFAULT NULL,                       -- When the ticket was assigned
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT status_check CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')), 
    FOREIGN KEY (raised_by_user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    FOREIGN KEY (responder_id) REFERENCES users(id)
);

-- EXPERT HELPDESK (LEGACY - DEPRECATED)
CREATE TABLE IF NOT EXISTS expert_helpdesk_legacy (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE,            -- Format: PV-TKT-YYYYMMDD-XXXXXX
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,           -- SuperAdmin/Admin/Expert/Customer
  receiver_role TEXT NOT NULL,         -- SuperAdmin/Admin/Expert/Customer
  receiver_id TEXT,                    -- NULL for role queue, specific user ID for targeted
  category TEXT DEFAULT 'Other',       -- Billing/Tasks/Payments/Technical/Account/Other
  priority TEXT DEFAULT 'MEDIUM',      -- Low/Medium/High
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'OPEN',          -- OPEN/IN_PROGRESS/CLOSED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- PAYMENTS (tracks payments for expert work)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  expert_id TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'INITIATED',     -- INITIATED/HOLD/RELEASED/FAILED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE
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
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_admin ON tasks(admin_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expert ON expert_certifications(expert_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_expert ON expert_portfolio(expert_id);
CREATE INDEX IF NOT EXISTS idx_earnings_expert ON expert_earnings(expert_id);
CREATE INDEX IF NOT EXISTS idx_tickets_raised_by ON tickets(raised_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- Expert tasks visibility indexes
CREATE INDEX IF NOT EXISTS idx_expert_tasks_expert ON expert_tasks(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_task ON expert_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_admin ON expert_tasks(admin_id);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_status ON expert_tasks(status);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_visibility ON expert_tasks(expert_id, admin_id, task_id);

-- Expert helpdesk visibility indexes (Legacy)
DROP INDEX IF EXISTS idx_helpdesk_sender;
DROP INDEX IF EXISTS idx_helpdesk_receiver;
DROP INDEX IF EXISTS idx_helpdesk_sender_role;
DROP INDEX IF EXISTS idx_helpdesk_receiver_role;
DROP INDEX IF EXISTS idx_helpdesk_status;
DROP INDEX IF EXISTS idx_helpdesk_visibility;

CREATE INDEX IF NOT EXISTS idx_helpdesk_sender ON expert_helpdesk_legacy(sender_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_receiver ON expert_helpdesk_legacy(receiver_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_sender_role ON expert_helpdesk_legacy(sender_role);
CREATE INDEX IF NOT EXISTS idx_helpdesk_receiver_role ON expert_helpdesk_legacy(receiver_role);
CREATE INDEX IF NOT EXISTS idx_helpdesk_status ON expert_helpdesk_legacy(status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_visibility ON expert_helpdesk_legacy(sender_id, receiver_id, sender_role, receiver_role);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_expert ON payments(expert_id);
CREATE INDEX IF NOT EXISTS idx_payments_task ON payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
