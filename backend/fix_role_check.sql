-- Fix role_check Constraint Migration
-- This script migrates the users table to a new schema with an expanded set of allowed roles

-- 1. Disable foreign key checks for the duration of the migration
PRAGMA foreign_keys = OFF;

-- 2. Rename existing users table
ALTER TABLE users RENAME TO users_old;

-- 3. Create new users table with correct constraints
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'expert', 'admin', 'superadmin', 'analyst', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
    email_verified INTEGER DEFAULT 0,
    avatar_data BLOB,
    avatar_mime_type TEXT,
    location TEXT,
    verified INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    skills TEXT,
    domains TEXT,
    availability TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    org_id TEXT DEFAULT 'ORG-DEFAULT',
    suspended INTEGER DEFAULT 0,
    profile_photo_url TEXT,
    bio TEXT,
    availability_type TEXT DEFAULT 'both',
    dob TEXT
);

-- 4. Create indices
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 5. Migrate data from users_old to users
-- Note: We lowercase role and status to ensure consistency with the new constraint
INSERT INTO users (
    id, name, email, phone, password_hash, role, status, 
    email_verified, avatar_data, avatar_mime_type, location, 
    verified, rating, skills, domains, availability, 
    last_login_at, created_at, updated_at, org_id, 
    suspended, profile_photo_url, bio, availability_type, dob
)
SELECT 
    id, name, email, phone, password_hash, LOWER(role), LOWER(status), 
    email_verified, avatar_data, avatar_mime_type, location, 
    verified, rating, skills, domains, availability, 
    last_login_at, created_at, updated_at, org_id, 
    suspended, profile_photo_url, bio, availability_type, dob
FROM users_old;

-- 6. Drop old table
DROP TABLE users_old;

-- 7. Re-enable foreign key checks
PRAGMA foreign_keys = ON;
