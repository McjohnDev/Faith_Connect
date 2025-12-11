-- Migration: Create recordings table (PostgreSQL version)
-- Version: 003
-- Description: Recordings table for meeting recordings stored in S3

-- Recordings table
CREATE TABLE IF NOT EXISTS recordings (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    recording_id VARCHAR(255) NOT NULL UNIQUE, -- Agora recording ID
    storage_url VARCHAR(500) NULL, -- S3 URL
    storage_key VARCHAR(500) NULL, -- S3 key for deletion
    duration INT NULL, -- Duration in seconds
    file_size BIGINT NULL, -- File size in bytes
    status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed
    started_by VARCHAR(36) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    stopped_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_recordings_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recordings_meeting_id ON recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recordings_recording_id ON recordings(recording_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
CREATE INDEX IF NOT EXISTS idx_recordings_started_at ON recordings(started_at);

-- Trigger for updated_at
CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

