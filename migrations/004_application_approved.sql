-- Separate application approval from app visibility
-- Run this in Supabase SQL Editor

-- Add application_approved column
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS application_approved BOOLEAN DEFAULT FALSE;

-- Comment
COMMENT ON COLUMN locations.application_approved IS 'True = can access dashboard. Separate from verified (shows on app).';

-- Set existing verified locations as application_approved too
UPDATE locations SET application_approved = true WHERE verified = true;
