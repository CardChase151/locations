-- Admin & Application Management Fields
-- Run this in Supabase SQL Editor

-- ============================================
-- ADMIN FLAG (users table)
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- APPLICATION MANAGEMENT (locations table)
-- ============================================
-- Admin notes from review/Zoom call
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- When application was reviewed
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Who reviewed it (admin user id)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Rejection flag (null = pending, true = rejected, false would mean verified)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT FALSE;

-- Rejection reason if rejected
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============================================
-- INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_locations_pending ON locations(verified, rejected) WHERE verified = FALSE AND rejected = FALSE;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN users.is_admin IS 'True if user has admin access to manage applications';
COMMENT ON COLUMN locations.admin_notes IS 'Internal notes from admin review/Zoom call';
COMMENT ON COLUMN locations.reviewed_at IS 'When the application was reviewed';
COMMENT ON COLUMN locations.reviewed_by IS 'Admin user who reviewed the application';
COMMENT ON COLUMN locations.rejected IS 'True if application was rejected';
COMMENT ON COLUMN locations.rejection_reason IS 'Reason for rejection if rejected';

-- ============================================
-- SET YOUR ADMIN USER
-- ============================================
-- Replace with your actual email after running migration:
-- UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
