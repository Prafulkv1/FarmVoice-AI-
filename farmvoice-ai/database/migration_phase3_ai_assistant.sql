-- =============================================================================
-- FarmVoice AI - Phase 3: AI Assistant Module Migration
-- Database: farmvoice_ai_db
-- =============================================================================
-- This script is NON-DESTRUCTIVE:
--   - Uses CREATE TABLE IF NOT EXISTS
--   - Adds ai_conversations and ai_messages tables
--   - Existing tables and records remain completely untouched
-- =============================================================================

USE farmvoice_ai_db;

-- ---------------------------------------------------------------------------
-- 1. ai_conversations : Chat session records per farmer
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Farming Advisory',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_conversations_user
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    INDEX idx_ai_conv_user (user_id),
    INDEX idx_ai_conv_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. ai_messages : Individual query & advisory messages within a conversation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    message TEXT NOT NULL,
    language VARCHAR(10) NULL DEFAULT 'en',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
    INDEX idx_ai_msg_conv (conversation_id),
    INDEX idx_ai_msg_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
