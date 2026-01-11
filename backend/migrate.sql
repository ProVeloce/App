-- =====================================================
-- ProVeloce D1 Migration Script
-- Run this to add new columns and tables
-- =====================================================

-- Add new columns to users table (SQLite allows one column at a time)
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN rating REAL;
ALTER TABLE users ADD COLUMN skills TEXT;
ALTER TABLE users ADD COLUMN domains TEXT;
ALTER TABLE users ADD COLUMN availability TEXT;

-- Create expert_tasks table
CREATE TABLE IF NOT EXISTS expert_tasks (
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

-- Create expert_helpdesk table
CREATE TABLE IF NOT EXISTS expert_helpdesk (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  receiver_role TEXT NOT NULL,
  receiver_id TEXT,
  category TEXT DEFAULT 'Other',
  priority TEXT DEFAULT 'MEDIUM',
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
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

-- Add domain and price_budget columns to tasks table
ALTER TABLE tasks ADD COLUMN domain TEXT;
ALTER TABLE tasks ADD COLUMN price_budget REAL;
ALTER TABLE tasks ADD COLUMN admin_id TEXT REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_tasks_admin ON tasks(admin_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_expert ON expert_tasks(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_task ON expert_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_admin ON expert_tasks(admin_id);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_status ON expert_tasks(status);
CREATE INDEX IF NOT EXISTS idx_expert_tasks_visibility ON expert_tasks(expert_id, admin_id, task_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_sender ON expert_helpdesk(sender_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_receiver ON expert_helpdesk(receiver_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_sender_role ON expert_helpdesk(sender_role);
CREATE INDEX IF NOT EXISTS idx_helpdesk_receiver_role ON expert_helpdesk(receiver_role);
CREATE INDEX IF NOT EXISTS idx_helpdesk_status ON expert_helpdesk(status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_visibility ON expert_helpdesk(sender_id, receiver_id, sender_role, receiver_role);
CREATE INDEX IF NOT EXISTS idx_payments_expert ON payments(expert_id);
CREATE INDEX IF NOT EXISTS idx_payments_task ON payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
