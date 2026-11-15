-- =============================================================================
-- FarmVoice AI - Migration: Add land_unit to farmer_profiles table
-- Database: farmvoice_ai_db
-- =============================================================================
USE farmvoice_ai_db;

-- Add land_unit column to farmer_profiles if it does not already exist
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'farmvoice_ai_db'
      AND TABLE_NAME = 'farmer_profiles'
      AND COLUMN_NAME = 'land_unit'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE farmer_profiles ADD COLUMN land_unit VARCHAR(20) NOT NULL DEFAULT "Acres" AFTER total_land_size',
    'SELECT "Column land_unit already exists in farmer_profiles"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
