-- ================================
-- Play Events Table for Analytics
-- ================================
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS play_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    duration_played INTEGER DEFAULT 0, -- seconds played
    completed BOOLEAN DEFAULT false, -- whether track was played to completion
    played_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_play_events_user_id ON play_events(user_id);
CREATE INDEX IF NOT EXISTS idx_play_events_track_id ON play_events(track_id);
CREATE INDEX IF NOT EXISTS idx_play_events_played_at ON play_events(played_at DESC);

-- RLS Policies
ALTER TABLE play_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own play events
CREATE POLICY "Users can insert own play events" ON play_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own play events
CREATE POLICY "Users can view own play events" ON play_events
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all play events (for analytics dashboard)
CREATE POLICY "Admins can view all play events" ON play_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant access to service role for analytics
GRANT ALL ON play_events TO service_role;

-- Comment
COMMENT ON TABLE play_events IS 'Stores track play events for analytics';
