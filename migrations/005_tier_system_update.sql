-- Locations Portal - Update Tier System
-- Run this in Supabase SQL Editor
--
-- TIER DEFINITIONS:
-- 0 = Free ($0) - Just listed, not clickable
-- 1 = Basic ($50/mo) - Clickable profile, 1 photo, 2 events, RSVP
-- 2 = Enhanced ($150/mo) - Verified badge, analytics, 10mi boost, weekly notifications
-- 3 = Premium ($300/mo) - Premium badge, Featured tab, 30mi boost, state alerts, loyalty

-- ============================================
-- UPDATE DEFAULT TIER
-- ============================================
-- New locations should start as Free (tier 0) until they pay
ALTER TABLE locations
ALTER COLUMN subscription_tier SET DEFAULT 0;

-- ============================================
-- UPDATE COMMENTS
-- ============================================
COMMENT ON COLUMN locations.subscription_tier IS 'Subscription level: 0=Free, 1=Basic($50), 2=Enhanced($150), 3=Premium($300)';

-- ============================================
-- ADD NEW TIER-RELATED COLUMNS (if needed)
-- ============================================

-- Track when subscription was last updated
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ;

-- Track follower notification count for Enhanced tier (max 1x/week)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS notifications_sent_this_week INTEGER DEFAULT 0;

-- Track last notification reset (for weekly limit)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS notification_week_start DATE;

-- ============================================
-- ADD EVENTS TABLE
-- ============================================

-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS location_events CASCADE;

CREATE TABLE location_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  photo_url TEXT,
  photos JSONB DEFAULT '[]',
  rsvp_count INTEGER DEFAULT 0,
  max_capacity INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_day TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_location_events_location_id ON location_events(location_id);
CREATE INDEX idx_location_events_date ON location_events(event_date);

-- ============================================
-- ADD PHOTO COLUMNS
-- ============================================

-- Primary photo (shown on cards and header)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Additional photos (JSON array of URLs)
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';

-- ============================================
-- UPDATE EXISTING LOCATIONS
-- ============================================

-- PREMIUM (Tier 3) - $300/mo - Featured tab, gold badge, UNLIMITED photos
-- Trainer Center
UPDATE locations SET
  subscription_tier = 3,
  subscription_status = 'active',
  application_approved = true,
  verified = true,
  description = 'The ultimate Pokemon trading destination! Weekly tournaments, rare card selection, and a welcoming community. Premium partner with exclusive events and the best selection in Orange County.',
  photo_url = 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop"]'
WHERE id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

-- App Catalyst
UPDATE locations SET
  subscription_tier = 3,
  subscription_status = 'active',
  application_approved = true,
  verified = true,
  description = 'Building the future of card trading! Premium tech-forward space with digital displays, live pricing, and state-of-the-art grading station.',
  photo_url = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=400&fit=crop"]'
WHERE id = 'efcff799-31f5-4818-aa78-9d02a7fadb9b';

-- Pokemon Palace Premium
UPDATE locations SET
  subscription_tier = 3,
  subscription_status = 'active',
  application_approved = true,
  verified = true,
  description = 'Newport Beach premier Pokemon destination. Luxury trading environment, VIP events, and exclusive card releases. The gold standard in card collecting.',
  photo_url = 'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&h=400&fit=crop"]'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- ENHANCED (Tier 2) - $150/mo - Verified badge, 5 photos max
-- Elite Pokemon Emporium
UPDATE locations SET
  subscription_tier = 2,
  subscription_status = 'active',
  application_approved = true,
  verified = true,
  description = 'Verified trading spot with weekly events and a solid selection of cards. Great community vibes!',
  photo_url = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800&h=400&fit=crop"]'
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- TCG Masters Arena
UPDATE locations SET
  subscription_tier = 2,
  subscription_status = 'active',
  application_approved = true,
  verified = true,
  description = 'San Diego verified partner with tournament space and competitive scene. Join our weekly battles!',
  photo_url = 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=400&fit=crop"]'
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- Pokemon Center NYC
UPDATE locations SET
  subscription_tier = 2,
  subscription_status = 'active',
  application_approved = true,
  verified = true,
  description = 'The official Pokemon Center experience in the heart of NYC. Verified partner with exclusive merchandise.',
  photo_url = 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop"]'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- BASIC (Tier 1) - $50/mo - 1 photo only
-- Bay Area Card Traders
UPDATE locations SET
  subscription_tier = 1,
  subscription_status = 'active',
  application_approved = true,
  verified = false,
  description = 'Local card shop serving the Bay Area community.',
  photo_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop"]'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Cards & Comics Plus
UPDATE locations SET
  subscription_tier = 1,
  subscription_status = 'active',
  application_approved = true,
  verified = false,
  description = 'Your neighborhood card and comics destination.',
  photo_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"]'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- Valley Card Exchange
UPDATE locations SET
  subscription_tier = 1,
  subscription_status = 'active',
  application_approved = true,
  verified = false,
  description = 'Riverside trading spot for local collectors.',
  photo_url = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=400&fit=crop',
  photos = '["https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=400&fit=crop"]'
WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- FREE (Tier 0) - $0 - No photos
-- Desert Pokemon Oasis
UPDATE locations SET
  subscription_tier = 0,
  subscription_status = 'free',
  application_approved = true,
  verified = false,
  photo_url = NULL,
  photos = '[]'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Local Card Shop
UPDATE locations SET
  subscription_tier = 0,
  subscription_status = 'free',
  application_approved = true,
  verified = false,
  photo_url = NULL,
  photos = '[]'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- ============================================
-- ADD SAMPLE EVENTS
-- ============================================

-- PREMIUM LOCATIONS GET 4 EVENTS/MONTH

-- Trainer Center Events (Premium - 4 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Tuesday Trade Night', 'Weekly trading session! Bring your binders and make some trades. All skill levels welcome.', CURRENT_DATE + INTERVAL '2 days', '18:00', '21:00', true, 'Tuesday', 50, 23),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Saturday Tournament', 'Competitive Pokemon TCG tournament with prizes! $10 entry fee.', CURRENT_DATE + INTERVAL '5 days', '12:00', '18:00', true, 'Saturday', 32, 28),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'New Set Release Party', 'Celebrate the latest Pokemon set! First 20 customers get a promo card.', CURRENT_DATE + INTERVAL '14 days', '10:00', '20:00', false, NULL, 100, 67),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Kids Learn to Play', 'Free event for kids 12 and under to learn Pokemon TCG basics.', CURRENT_DATE + INTERVAL '7 days', '14:00', '16:00', true, 'Sunday', 20, 12);

-- App Catalyst Events (Premium - 4 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('efcff799-31f5-4818-aa78-9d02a7fadb9b', 'Wednesday Night Trades', 'Mid-week trading meetup. Coffee and snacks provided!', CURRENT_DATE + INTERVAL '3 days', '19:00', '22:00', true, 'Wednesday', 40, 18),
('efcff799-31f5-4818-aa78-9d02a7fadb9b', 'Grading Submission Day', 'Bulk grading submission event. PSA and CGC available.', CURRENT_DATE + INTERVAL '10 days', '11:00', '17:00', false, NULL, 30, 25),
('efcff799-31f5-4818-aa78-9d02a7fadb9b', 'Vintage Showcase', 'Show off your vintage cards! Best collection wins a prize.', CURRENT_DATE + INTERVAL '21 days', '13:00', '17:00', false, NULL, 50, 31),
('efcff799-31f5-4818-aa78-9d02a7fadb9b', 'Friday Night Pokemon', 'Casual play and trades every Friday night.', CURRENT_DATE + INTERVAL '4 days', '18:00', '22:00', true, 'Friday', 60, 42);

-- Pokemon Palace Premium Events (Premium - 4 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('33333333-3333-3333-3333-333333333333', 'VIP Trade Night', 'Exclusive trading event for serious collectors. High-value cards only.', CURRENT_DATE + INTERVAL '6 days', '19:00', '22:00', true, 'Thursday', 25, 22),
('33333333-3333-3333-3333-333333333333', 'Championship Series', 'Regional qualifier tournament. Top 4 advance to finals.', CURRENT_DATE + INTERVAL '12 days', '10:00', '19:00', false, NULL, 64, 58),
('33333333-3333-3333-3333-333333333333', 'Collector Meetup', 'Monthly collector gathering. Show and tell your best pulls!', CURRENT_DATE + INTERVAL '8 days', '15:00', '18:00', false, NULL, 40, 35),
('33333333-3333-3333-3333-333333333333', 'Sunday Funday', 'Family-friendly trading and games every Sunday.', CURRENT_DATE + INTERVAL '1 day', '12:00', '17:00', true, 'Sunday', 80, 45);

-- ENHANCED LOCATIONS GET 2 EVENTS/MONTH

-- Elite Pokemon Emporium Events (Enhanced - 2 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Thursday Trade Night', 'Weekly trading meetup for the community.', CURRENT_DATE + INTERVAL '4 days', '18:00', '21:00', true, 'Thursday', 30, 15),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Monthly Tournament', 'Casual tournament with store credit prizes.', CURRENT_DATE + INTERVAL '15 days', '13:00', '18:00', false, NULL, 24, 20);

-- TCG Masters Arena Events (Enhanced - 2 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Saturday Showdown', 'Weekly competitive play every Saturday.', CURRENT_DATE + INTERVAL '5 days', '14:00', '19:00', true, 'Saturday', 32, 26),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'League Night', 'Pokemon League play and badge earning.', CURRENT_DATE + INTERVAL '9 days', '17:00', '20:00', true, 'Wednesday', 40, 18);

-- Pokemon Center NYC Events (Enhanced - 2 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Meet & Trade', 'Open trading floor every weekend.', CURRENT_DATE + INTERVAL '6 days', '11:00', '16:00', true, 'Saturday', 100, 72),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Special Release Event', 'Exclusive merchandise and card release.', CURRENT_DATE + INTERVAL '20 days', '10:00', '20:00', false, NULL, 200, 156);

-- BASIC LOCATIONS GET 2 EVENTS/MONTH

-- Bay Area Card Traders Events (Basic - 2 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('22222222-2222-2222-2222-222222222222', 'Friday Trades', 'Casual trading every Friday.', CURRENT_DATE + INTERVAL '4 days', '17:00', '20:00', true, 'Friday', 20, 8),
('22222222-2222-2222-2222-222222222222', 'Weekend Battle', 'Casual play on Saturdays.', CURRENT_DATE + INTERVAL '5 days', '12:00', '16:00', true, 'Saturday', 16, 10);

-- Cards & Comics Plus Events (Basic - 2 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Tuesday Trades', 'Weekly trade night.', CURRENT_DATE + INTERVAL '2 days', '18:00', '21:00', true, 'Tuesday', 15, 7),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Game Day', 'Open play every Sunday.', CURRENT_DATE + INTERVAL '1 day', '13:00', '17:00', true, 'Sunday', 20, 11);

-- Valley Card Exchange Events (Basic - 2 events)
INSERT INTO location_events (location_id, name, description, event_date, start_time, end_time, is_recurring, recurrence_day, max_capacity, rsvp_count) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Saturday Swap', 'Trading meetup every Saturday.', CURRENT_DATE + INTERVAL '5 days', '11:00', '15:00', true, 'Saturday', 25, 14),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'First Friday', 'Monthly special trading event.', CURRENT_DATE + INTERVAL '7 days', '18:00', '21:00', false, NULL, 30, 19);

-- FREE LOCATIONS GET 0 EVENTS (no events for free tier)
