-- Location blocked times table
-- Allows locations to block off time periods when no trades can be scheduled

CREATE TABLE IF NOT EXISTS location_blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,           -- NULL if all_day is true
  end_time TIME,             -- NULL if all_day is true
  all_day BOOLEAN DEFAULT false,
  reason TEXT,               -- Optional reason (e.g., "Holiday", "Staff meeting")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_blocked_times_location_date
ON location_blocked_times(location_id, date);

-- RLS Policies
ALTER TABLE location_blocked_times ENABLE ROW LEVEL SECURITY;

-- Anyone can view blocked times (needed for app scheduling)
CREATE POLICY "Anyone can view blocked times"
ON location_blocked_times FOR SELECT
TO authenticated
USING (true);

-- Location owners/admins can manage blocked times
CREATE POLICY "Owners can manage blocked times"
ON location_blocked_times FOR ALL
TO authenticated
USING (
  location_id IN (
    SELECT location_id FROM location_staff
    WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    AND status = 'active'
    AND (role = 'owner' OR can_add_staff = true)
  )
);
