-- CardChase Locations Portal - Add Location-Specific Fields
-- Run this in Supabase SQL Editor
-- This ADDS new columns, does NOT delete anything

-- ============================================
-- CURRENT USERS TABLE COLUMNS (for reference)
-- ============================================
-- id, auth_id, email, first_name, last_name, username
-- gender, birth_date, is_minor
-- parent_first_name, parent_last_name, parent_email, parent_phone
-- banner_url, avatar_url
-- avg_rating, total_ratings, successful_trades, trade_level
-- push_token, bio
-- address_line1, address_line2, city, state, zip_code, country
-- latitude, longitude, location_accuracy, location_updated_at
-- location_sharing_enabled, location_radius_km, location_enabled
-- location_method, location_city, location_state, manual_location
-- search_radius, sound_enabled
-- hide_profile, is_under_18, wants_to_trade
-- is_parent, parent_will_trade, has_own_auth
-- default_profile_id, parent_invite_sent, parent_invite_token
-- auth_invite_token, auth_invite_expires
--
-- EXISTING SHARED FIELDS (used by both app and old site):
-- is_location, intake_completed, approved_by_admin
-- contract_agreed, contract_agreed_at, location_data
-- created_at, updated_at

-- ============================================
-- LOCATION-SPECIFIC COLUMNS
-- ============================================
-- These are SEPARATE from app fields so they don't conflict

-- Location intake/request tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_intake_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_request_submitted_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_request_updated_at TIMESTAMPTZ;

-- Approval tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_approved BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_approved_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_rejected BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_rejected_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_rejection_reason TEXT;

-- Contract tracking (separate from app contract)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_contract_agreed BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_contract_agreed_at TIMESTAMPTZ;

-- Business details
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_name VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_phone VARCHAR(50);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_address TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_city VARCHAR(100);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_state VARCHAR(50);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_zip VARCHAR(20);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_website VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_description TEXT;

-- Subscription tier
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_subscription_tier VARCHAR(20) DEFAULT 'free';

-- ============================================
-- INDEXES FOR FASTER QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_is_location ON users(is_location) WHERE is_location = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_location_approved ON users(location_approved) WHERE location_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_location_pending ON users(location_intake_completed, location_approved)
  WHERE location_intake_completed = TRUE AND location_approved = FALSE AND location_rejected = FALSE;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN users.location_intake_completed IS 'True if location owner submitted the application form';
COMMENT ON COLUMN users.location_request_submitted_at IS 'Timestamp when application was first submitted (never changes, for first-come-first-serve)';
COMMENT ON COLUMN users.location_request_updated_at IS 'Timestamp when application info was last edited';
COMMENT ON COLUMN users.location_approved IS 'True if CardChase admin approved this location';
COMMENT ON COLUMN users.location_approved_at IS 'Timestamp when approved';
COMMENT ON COLUMN users.location_rejected IS 'True if CardChase admin rejected this location';
COMMENT ON COLUMN users.location_rejected_at IS 'Timestamp when rejected';
COMMENT ON COLUMN users.location_rejection_reason IS 'Reason for rejection (shown to applicant)';
COMMENT ON COLUMN users.location_contract_agreed IS 'True if location owner agreed to the partner contract';
COMMENT ON COLUMN users.location_contract_agreed_at IS 'Timestamp when contract was agreed';
COMMENT ON COLUMN users.location_business_name IS 'Business/store name';
COMMENT ON COLUMN users.location_business_phone IS 'Business phone number';
COMMENT ON COLUMN users.location_business_address IS 'Street address';
COMMENT ON COLUMN users.location_business_city IS 'City';
COMMENT ON COLUMN users.location_business_state IS 'State';
COMMENT ON COLUMN users.location_business_zip IS 'ZIP code';
COMMENT ON COLUMN users.location_business_website IS 'Business website URL';
COMMENT ON COLUMN users.location_business_description IS 'Description of the business';
COMMENT ON COLUMN users.location_subscription_tier IS 'Subscription level: free, basic, pro, enterprise';

-- ============================================
-- VIEW: Pending Location Approvals (for admin)
-- ============================================
CREATE OR REPLACE VIEW location_approval_queue AS
SELECT
    id,
    auth_id,
    email,
    first_name,
    last_name,
    location_business_name,
    location_business_phone,
    location_business_address,
    location_business_city,
    location_business_state,
    location_business_zip,
    location_business_website,
    location_business_description,
    location_request_submitted_at,
    location_request_updated_at
FROM users
WHERE is_location = TRUE
  AND location_intake_completed = TRUE
  AND location_approved = FALSE
  AND (location_rejected = FALSE OR location_rejected IS NULL)
ORDER BY location_request_submitted_at ASC;

-- ============================================
-- FIELD USAGE SUMMARY
-- ============================================
-- APP FIELDS (set by CardChase app GameScreen):
--   intake_completed = app profile intake done
--   contract_agreed = app terms agreed
--   contract_agreed_at = app terms timestamp
--
-- LOCATION FIELDS (set by Locations portal):
--   is_location = true when registered as location
--   location_intake_completed = application submitted
--   location_request_submitted_at = first submission time (first-come-first-serve)
--   location_request_updated_at = last edit time
--   location_approved = admin approved
--   location_approved_at = approval timestamp
--   location_rejected = admin rejected
--   location_rejected_at = rejection timestamp
--   location_rejection_reason = why rejected
--   location_contract_agreed = partner contract agreed
--   location_contract_agreed_at = contract timestamp
--   location_business_* = business info fields
--   location_subscription_tier = subscription level
