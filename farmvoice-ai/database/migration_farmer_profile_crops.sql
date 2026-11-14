-- =============================================================================
-- FarmVoice AI - Farmer Profile Crops Migration Script
-- Database: farmvoice_ai_db
-- =============================================================================
-- This script creates the dedicated farmer_profile_crops table
-- referencing farmer_profiles(profile_id), enforcing:
--   - Foreign key to farmer_profiles with ON DELETE CASCADE
--   - Unique constraint (profile_id, crop_name) to prevent duplicates
--   - Safe non-destructive execution (CREATE TABLE IF NOT EXISTS)
--   - Data preservation: safely copies existing profile crop associations
-- =============================================================================

USE farmvoice_ai_db;

CREATE TABLE IF NOT EXISTS farmer_profile_crops (
    id          INT          NOT NULL AUTO_INCREMENT,
    profile_id  INT          NOT NULL,
    crop_name   VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_profile_crop (profile_id, crop_name),
    CONSTRAINT fk_farmer_profile_crops_profile
        FOREIGN KEY (profile_id) REFERENCES farmer_profiles(profile_id) ON DELETE CASCADE,
    INDEX idx_farmer_profile_crops_profile (profile_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Safely copy any existing crop records into farmer_profile_crops
INSERT IGNORE INTO farmer_profile_crops (profile_id, crop_name, created_at)
SELECT p.profile_id, c.crop_name, c.created_at
FROM farmer_crops c
JOIN farmer_profiles p ON p.user_id = c.user_id;
