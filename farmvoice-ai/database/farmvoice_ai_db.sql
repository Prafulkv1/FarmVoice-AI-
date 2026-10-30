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
-- End of script
-- =============================================================================
