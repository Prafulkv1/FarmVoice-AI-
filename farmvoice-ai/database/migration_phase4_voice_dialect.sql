-- =============================================================================
-- FarmVoice AI - Phase 4: Multilingual Voice & Dialect Migration
-- Database: farmvoice_ai_db
-- =============================================================================
-- Non-destructive addition of dialect and voice preference columns
-- =============================================================================

USE farmvoice_ai_db;

-- 1. Add dialect and voice preferences to farmer_profiles
ALTER TABLE farmer_profiles
    ADD COLUMN preferred_dialect VARCHAR(50) NOT NULL DEFAULT 'standard' COMMENT 'Regional dialect preference',
    ADD COLUMN voice_enabled TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 if voice response is enabled',
    ADD COLUMN auto_play_voice TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if voice response plays automatically';

-- 2. Add dialect to ai_conversations
ALTER TABLE ai_conversations
    ADD COLUMN dialect VARCHAR(50) NOT NULL DEFAULT 'standard' COMMENT 'Conversation dialect';
