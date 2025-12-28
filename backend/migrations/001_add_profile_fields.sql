-- =====================================================
-- Migration: Add full_name and phone_number to user_profiles
-- Run: npx wrangler d1 execute proveloce_db --file=migrations/001_add_profile_fields.sql
-- =====================================================

-- Add full_name column
ALTER TABLE user_profiles ADD COLUMN full_name TEXT;

-- Add phone_number column
ALTER TABLE user_profiles ADD COLUMN phone_number TEXT;
