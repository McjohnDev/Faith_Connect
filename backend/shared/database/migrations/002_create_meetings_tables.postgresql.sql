-- Migration: Create meetings tables (PostgreSQL version)
-- Version: 002
-- Description: Meetings and participants tables for live prayer meetings

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NULL,
    host_id VARCHAR(36) NOT NULL,
    channel_name VARCHAR(255) NOT NULL UNIQUE,
    agora_app_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    scheduled_start TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    max_participants INT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    background_music_enabled BOOLEAN DEFAULT FALSE,
    recording_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meetings_host_id ON meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_channel_name ON meetings(channel_name);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Meeting participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) NOT NULL,
    is_muted BOOLEAN DEFAULT FALSE,
    has_raised_hand BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    agora_uid INT NULL,
    
    CONSTRAINT fk_participants_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_role ON meeting_participants(role);
CREATE INDEX IF NOT EXISTS idx_participants_joined_at ON meeting_participants(joined_at);

