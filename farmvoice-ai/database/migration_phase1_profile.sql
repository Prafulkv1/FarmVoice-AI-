-- =============================================================================
-- FarmVoice AI - Phase 1: Farmer Profile Management
-- Database Migration Script
-- Database: farmvoice_ai_db (existing)
-- =============================================================================
-- This script is NON-DESTRUCTIVE:
--   - Uses CREATE TABLE IF NOT EXISTS (no existing table is altered or dropped)
--   - Only adds two new tables: farmer_profiles and farmer_crops
--   - Existing farmers table and data are preserved untouched
-- =============================================================================

USE farmvoice_ai_db;

-- ---------------------------------------------------------
-- farmer_profiles : one profile per registered farmer (user)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmer_profiles (
    profile_id           INT          NOT NULL AUTO_INCREMENT,
    user_id              INT          NOT NULL,
    full_name            VARCHAR(150) NOT NULL,
    mobile_number        VARCHAR(10)  NOT NULL,
    state                VARCHAR(100) NOT NULL,
    district             VARCHAR(100) NOT NULL,
    taluk                VARCHAR(100) NOT NULL,
    village              VARCHAR(150) NOT NULL,
    pin_code             VARCHAR(10)  NOT NULL,
    total_land_size      DECIMAL(6,2) NOT NULL,
    soil_type            VARCHAR(50)  NOT NULL,
    irrigation_type      VARCHAR(50)  NOT NULL,
    farming_experience   INT          NULL,
    preferred_language   VARCHAR(50)  NOT NULL DEFAULT 'English',
    notifications_enabled TINYINT(1)  NOT NULL DEFAULT 1,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id),
    UNIQUE KEY uk_user_id (user_id),
    CONSTRAINT fk_farmer_profiles_user_id
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- farmer_crops : normalized multi-crop selection per farmer
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmer_crops (
    crop_id    INT         NOT NULL AUTO_INCREMENT,
    user_id    INT         NOT NULL,
    crop_name  VARCHAR(100) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (crop_id),
    UNIQUE KEY uk_user_id_crop_name (user_id, crop_name),
    CONSTRAINT fk_farmer_crops_user_id
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- End of Phase 1 migration
-- =============================================================================
