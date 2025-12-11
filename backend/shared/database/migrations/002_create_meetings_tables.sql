-- Migration: Create meetings tables
-- Supports both MySQL and PostgreSQL
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_host_id (host_id),
    INDEX idx_status (status),
    INDEX idx_channel_name (channel_name),
    INDEX idx_created_at (created_at)
);

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
    
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    INDEX idx_joined_at (joined_at)
);

