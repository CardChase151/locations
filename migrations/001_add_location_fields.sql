-- CardChase Locations Portal - User Fields Only
-- Run this in Supabase SQL Editor
--
-- NOTE: Business details go in `locations` table (see cardchase1 migration)
-- This just adds fields to `users` table to track location owner status

-- ============================================
-- LOCATION OWNER FLAGS (users table)
-- ============================================
-- Marks user as a location owner
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_location BOOLEAN DEFAULT FALSE;

-- Links to their location record in locations table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_id UUID;

-- ============================================
-- INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_is_location ON users(is_location) WHERE is_location = TRUE;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN users.is_location IS 'True if user is a location/store owner';
COMMENT ON COLUMN users.location_id IS 'Links to locations table record they own';

-- ============================================
-- SUMMARY
-- ============================================
-- users table: is_location, location_id (just flags/links)
-- locations table: all business details, owner_id, verified, submitted_at, etc.
--
-- Flow:
-- 1. User signs up on portal → is_location = true
-- 2. User submits application → creates locations record with verified = false
-- 3. Admin approves → verified = true
-- 4. App shows locations WHERE verified = true
