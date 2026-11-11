-- =============================================================================
-- FarmVoice AI - Phase 2: Farm Diary Management
-- Database Migration Script
-- Database: farmvoice_ai_db (existing)
-- =============================================================================
-- This script is NON-DESTRUCTIVE:
--   - Uses CREATE TABLE IF NOT EXISTS (no existing table is dropped or reset)
--   - ALTERs farmer_crops to ADD new Phase-2 columns only (existing data preserved)
--   - Adds 6 new Farm Diary tables
--   - Existing farmers, farmer_profiles and farmer_crops data are preserved
-- =============================================================================

USE farmvoice_ai_db;

-- ---------------------------------------------------------------------------
-- 1. Extend the existing farmer_crops table (Phase 1) with Phase 2 fields.
--     No existing column is modified or dropped; only new columns are added.
-- ---------------------------------------------------------------------------
ALTER TABLE farmer_crops
    ADD COLUMN crop_variety VARCHAR(100) NULL COMMENT 'Optional crop variety',
    ADD COLUMN land_area DECIMAL(6,2) NULL COMMENT 'Land area in acres',
    ADD COLUMN sowing_date DATE NULL COMMENT 'Date of sowing',
    ADD COLUMN expected_harvest_date DATE NULL COMMENT 'Expected harvest date',
    ADD COLUMN season ENUM('Kharif','Rabi','Zaid','Other') NULL COMMENT 'Crop season',
    ADD COLUMN crop_status ENUM('Planned','Growing','Harvested') NULL DEFAULT 'Planned' COMMENT 'Current crop status',
    ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp'
;

-- Index to speed up farmer-based lookups (user_id already indexed from Phase 1)
CREATE INDEX idx_farmer_crops_status ON farmer_crops (crop_status);
CREATE INDEX idx_farmer_crops_season ON farmer_crops (season);

-- ---------------------------------------------------------------------------
-- 2. farm_activities : daily farming activity records per farmer & crop
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farm_activities (
    activity_id       INT          NOT NULL AUTO_INCREMENT,
    user_id           INT          NOT NULL,
    crop_id           INT          NULL,
    activity_date     DATE         NOT NULL,
    activity_type     VARCHAR(50)  NOT NULL,
    activity_description TEXT      NOT NULL,
    notes             VARCHAR(500) NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (activity_id),
    CONSTRAINT fk_farm_activities_user_id
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    CONSTRAINT fk_farm_activities_crop_id
        FOREIGN KEY (crop_id) REFERENCES farmer_crops(crop_id) ON DELETE SET NULL,
    INDEX idx_farm_activities_user (user_id),
    INDEX idx_farm_activities_crop (crop_id),
    INDEX idx_farm_activities_date (activity_date),
    INDEX idx_farm_activities_type (activity_type)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. fertilizer_records : fertilizer application history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fertilizer_records (
    record_id         INT          NOT NULL AUTO_INCREMENT,
    user_id           INT          NOT NULL,
    crop_id           INT          NULL,
    fertilizer_name   VARCHAR(100) NOT NULL,
    fertilizer_type   VARCHAR(50)  NOT NULL,
    quantity_used     DECIMAL(10,3) NOT NULL,
    application_date  DATE         NOT NULL,
    notes             VARCHAR(500) NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id),
    CONSTRAINT fk_fertilizer_records_user_id
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    CONSTRAINT fk_fertilizer_records_crop_id
        FOREIGN KEY (crop_id) REFERENCES farmer_crops(crop_id) ON DELETE SET NULL,
    INDEX idx_fertilizer_records_user (user_id),
    INDEX idx_fertilizer_records_crop (crop_id),
    INDEX idx_fertilizer_records_date (application_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. irrigation_records : irrigation history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS irrigation_records (
    record_id          INT          NOT NULL AUTO_INCREMENT,
    user_id            INT          NOT NULL,
    crop_id            INT          NULL,
    irrigation_date    DATE         NOT NULL,
    irrigation_method  VARCHAR(50)  NOT NULL,
    duration           VARCHAR(50)  NOT NULL,
    water_usage        DECIMAL(10,3) NULL,
    notes              VARCHAR(500) NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id),
    CONSTRAINT fk_irrigation_records_user_id
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    CONSTRAINT fk_irrigation_records_crop_id
        FOREIGN KEY (crop_id) REFERENCES farmer_crops(crop_id) ON DELETE SET NULL,
    INDEX idx_irrigation_records_user (user_id),
    INDEX idx_irrigation_records_crop (crop_id),
    INDEX idx_irrigation_records_date (irrigation_date),
    INDEX idx_irrigation_records_method (irrigation_method)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. pest_management_records : pesticide applications & pest observations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pest_management_records (
    record_id             INT          NOT NULL AUTO_INCREMENT,
    user_id               INT          NOT NULL,
    crop_id               INT          NULL,
    record_type           ENUM('Pesticide Application','Pest Observation') NOT NULL,
    pesticide_name        VARCHAR(100) NULL,
    pest_or_disease_name  VARCHAR(100) NOT NULL,
    application_or_observation_date DATE NOT NULL,
    notes                 VARCHAR(500) NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id),
    CONSTRAINT fk_pest_management_records_user_id
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    CONSTRAINT fk_pest_management_records_crop_id
        FOREIGN KEY (crop_id) REFERENCES farmer_crops(crop_id) ON DELETE SET NULL,
    INDEX idx_pest_management_records_user (user_id),
    INDEX idx_pest_management_records_crop (crop_id),
    INDEX idx_pest_management_records_type (record_type),
    INDEX idx_pest_management_records_date (application_or_observation_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. harvest_records : harvesting information
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_records (
    record_id          INT          NOT NULL AUTO_INCREMENT,
    user_id            INT          NOT NULL,
    crop_id            INT          NULL,
    harvest_date       DATE         NOT NULL,
    quantity_harvested DECIMAL(10,3) NOT NULL,
    quantity_unit      ENUM('kg','quintal','tonne') NOT NULL,
    quality_or_grade   VARCHAR(50)  NULL,
    notes              VARCHAR(500) NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id),
    CONSTRAINT fk_harvest_records_user_id
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    CONSTRAINT fk_harvest_records_crop_id
        FOREIGN KEY (crop_id) REFERENCES farmer_crops(crop_id) ON DELETE SET NULL,
    INDEX idx_harvest_records_user (user_id),
    INDEX idx_harvest_records_crop (crop_id),
    INDEX idx_harvest_records_date (harvest_date),
    INDEX idx_harvest_records_unit (quantity_unit)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. farm_expenses : farming expense records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farm_expenses (
    expense_id         INT          NOT NULL AUTO_INCREMENT,
    user_id            INT          NOT NULL,
    crop_id            INT          NULL,
    expense_category   VARCHAR(50)  NOT NULL,
    amount             DECIMAL(10,2) NOT NULL,
    expense_date       DATE         NOT NULL,
    description        VARCHAR(300) NOT NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (expense_id),
    CONSTRAINT fk_farm_expenses_user_id
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    CONSTRAINT fk_farm_expenses_crop_id
        FOREIGN KEY (crop_id) REFERENCES farmer_crops(crop_id) ON DELETE SET NULL,
    INDEX idx_farm_expenses_user (user_id),
    INDEX idx_farm_expenses_crop (crop_id),
    INDEX idx_farm_expenses_date (expense_date),
    INDEX idx_farm_expenses_category (expense_category)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- End of Phase 2 migration
-- =============================================================================