-- Expert Connect Feature - Database Schema Migration
-- Run: npx wrangler d1 execute proveloce_db --file=expert_connect_schema.sql --remote

-- =====================================================
-- Expert Time Slots (availability windows)
-- =====================================================
CREATE TABLE IF NOT EXISTS expert_time_slots (
    id TEXT PRIMARY KEY,
    expert_id TEXT NOT NULL,
    slot_label TEXT NOT NULL CHECK (slot_label IN ('00-06', '06-12', '12-18', '18-24')),
    day_type TEXT NOT NULL CHECK (day_type IN ('weekdays', 'weekends', 'both')) DEFAULT 'both',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(expert_id, slot_label, day_type)
);

CREATE INDEX IF NOT EXISTS idx_expert_slots_expert ON expert_time_slots(expert_id);

-- =====================================================
-- Connect Requests (customer to expert)
-- =====================================================
CREATE TABLE IF NOT EXISTS connect_requests (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    expert_id TEXT NOT NULL,
    requested_date DATE NOT NULL,
    requested_day_type TEXT NOT NULL CHECK (requested_day_type IN ('weekdays', 'weekends')),
    requested_slot_label TEXT NOT NULL CHECK (requested_slot_label IN ('00-06', '06-12', '12-18', '18-24')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    customer_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_connect_requests_expert ON connect_requests(expert_id, status);
CREATE INDEX IF NOT EXISTS idx_connect_requests_customer ON connect_requests(customer_id);

-- =====================================================
-- Sessions (live video/chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    expert_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_slot_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    room_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expert ON sessions(expert_id);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);

-- =====================================================
-- Session Messages (chat during sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS session_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content_text TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);

-- =====================================================
-- Add domains column to users if not exists (for expert search)
-- =====================================================
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE
-- Run this manually if needed: ALTER TABLE users ADD COLUMN domains TEXT;
