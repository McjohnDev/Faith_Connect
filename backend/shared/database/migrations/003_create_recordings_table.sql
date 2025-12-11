-- Migration: Create recordings table
-- Supports both MySQL and PostgreSQL
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_recording_id (recording_id),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
);

