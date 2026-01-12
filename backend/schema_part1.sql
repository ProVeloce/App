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
  role TEXT DEFAULT 'user' NOT NULL,
  status TEXT DEFAULT 'Active' NOT NULL,
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
  CONSTRAINT role_check CHECK (role IN ('superadmin', 'admin', 'user', 'expert')),
  CONSTRAINT status_check CHECK (status IN ('Active', 'Suspended', 'Deactivated'))
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
