-- Locations Portal - Add missing columns to locations table
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX NOT NULL CONSTRAINTS
-- ============================================
ALTER TABLE locations ALTER COLUMN operating_hours DROP NOT NULL;

-- ============================================
-- BUSINESS INFO FIELDS
-- ============================================

-- Core business info (may already exist)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS store_name TEXT;

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS zip_code TEXT;

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS website TEXT;

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Owner's auth user id
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS owner_id UUID;

-- ============================================
-- APPLICATION TRACKING FIELDS
-- ============================================

-- When the application was submitted
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- When the application was last updated by the applicant
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS application_updated_at TIMESTAMPTZ;

-- Where the application came from
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'partner';

-- Subscription tier (1 = basic, 2 = pro, etc.)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS subscription_tier INTEGER DEFAULT 1;

-- Subscription status (pending, active, cancelled, etc.)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending';

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN locations.description IS 'Business description from partner application';
COMMENT ON COLUMN locations.owner_id IS 'Auth user ID of the location owner';
COMMENT ON COLUMN locations.submitted_at IS 'When the partner application was first submitted';
COMMENT ON COLUMN locations.application_updated_at IS 'When the application was last updated by the applicant';
COMMENT ON COLUMN locations.source IS 'Where the location came from (partner, manual, import, etc.)';
COMMENT ON COLUMN locations.subscription_tier IS 'Subscription level (1=basic, 2=pro, etc.)';
COMMENT ON COLUMN locations.subscription_status IS 'Subscription status (pending, active, cancelled)';
