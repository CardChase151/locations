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
-- NEW LOCATION-SPECIFIC COLUMNS
-- ============================================
-- These are SEPARATE from app fields so they don't conflict

-- Location intake completed (separate from app intake_completed)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_intake_completed BOOLEAN DEFAULT FALSE;

-- Location approved by admin (can reuse approved_by_admin or use this)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_approved BOOLEAN DEFAULT FALSE;

-- Location contract agreed (separate from app contract_agreed)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_contract_agreed BOOLEAN DEFAULT FALSE;

-- Location contract agreed timestamp
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_contract_agreed_at TIMESTAMPTZ;

-- Location business details (structured, separate from location_data JSONB)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_name VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_phone VARCHAR(50);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_business_address TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_subscription_tier VARCHAR(20) DEFAULT 'free';

-- ============================================
-- INDEXES FOR FASTER QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_is_location ON users(is_location) WHERE is_location = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_location_approved ON users(location_approved) WHERE location_approved = TRUE;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN users.location_intake_completed IS 'True if location owner completed the location portal intake form (separate from app intake)';
COMMENT ON COLUMN users.location_approved IS 'True if CardChase admin approved this location';
COMMENT ON COLUMN users.location_contract_agreed IS 'True if location owner agreed to the location partner contract';
COMMENT ON COLUMN users.location_contract_agreed_at IS 'Timestamp when location contract was agreed';
COMMENT ON COLUMN users.location_business_name IS 'Business/store name for location partners';
COMMENT ON COLUMN users.location_business_phone IS 'Business phone number';
COMMENT ON COLUMN users.location_business_address IS 'Full business address';
COMMENT ON COLUMN users.location_subscription_tier IS 'Location subscription: free, basic, pro, enterprise';

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
--   location_intake_completed = location intake done
--   location_approved = admin approved
--   location_contract_agreed = location contract agreed
--   location_contract_agreed_at = location contract timestamp
--   location_business_name = store name
--   location_business_phone = store phone
--   location_business_address = store address
--   location_subscription_tier = subscription level
--   location_data = JSONB for additional flexible data
