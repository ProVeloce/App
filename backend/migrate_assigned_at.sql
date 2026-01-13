-- Migration: Add assigned_at to tickets table
ALTER TABLE tickets ADD COLUMN assigned_at TIMESTAMP DEFAULT NULL;
