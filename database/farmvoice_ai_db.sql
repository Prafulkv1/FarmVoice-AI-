-- =============================================================================
-- FarmVoice AI - MySQL Database Initialization Script
-- =============================================================================
-- Database: farmvoice_ai_db
-- Table: farmers
-- =============================================================================

-- Create the database if it does not exist
CREATE DATABASE IF NOT EXISTS farmvoice_ai_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE farmvoice_ai_db;

-- Create the farmers table
CREATE TABLE IF NOT EXISTS farmers (
    farmer_id       INT          NOT NULL AUTO_INCREMENT,
    farm_name       VARCHAR(150) NOT NULL,
    username        VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    mobile_number   VARCHAR(10)  NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (farmer_id),
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Table: farmer_profiles (Phase 1 - Farmer Profile Management)
-- =============================================================================
CREATE TABLE IF NOT EXISTS farmer_profiles (
    profile_id        INT          NOT NULL AUTO_INCREMENT,
    user_id           INT          NOT NULL,
    state             VARCHAR(100) NOT NULL,
    district          VARCHAR(100) NOT NULL,
    taluk             VARCHAR(100) NOT NULL,
    village           VARCHAR(100) NOT NULL,
    pin_code          VARCHAR(10)  NOT NULL,
    total_land_size   DECIMAL(6,2) NOT NULL,
    soil_type         VARCHAR(50)  NOT NULL,
    irrigation_type   VARCHAR(50)  NOT NULL,
    farming_experience INT         NULL,
    preferred_language VARCHAR(50) NOT NULL DEFAULT 'English',
    notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id),
    UNIQUE KEY uk_user_id (user_id),
    CONSTRAINT fk_farmer_profiles_user_id
        FOREIGN KEY (user_id) REFERENCES farmers (farmer_id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Table: farmer_crops (Phase 1 - Multiple crops per farmer profile)
-- =============================================================================
CREATE TABLE IF NOT EXISTS farmer_crops (
    crop_id     INT            NOT NULL AUTO_INCREMENT,
    profile_id  INT            NOT NULL,
    crop_name   VARCHAR(100)   NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (crop_id),
    CONSTRAINT fk_farmer_crops_profile_id
        FOREIGN KEY (profile_id) REFERENCES farmer_profiles (profile_id)
        ON DELETE CASCADE,
    INDEX idx_farmer_crops_profile (profile_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- End of script
-- =============================================================================
