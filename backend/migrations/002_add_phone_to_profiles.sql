-- Migration: Add phone column to user_profiles table
-- This allows storing phone in user_profiles for profile-related data

ALTER TABLE user_profiles ADD COLUMN phone TEXT;
