-- =============================================================================
-- FarmVoice AI - Migration: Create weather_records table
-- Database: farmvoice_ai_db
-- =============================================================================
USE farmvoice_ai_db;

CREATE TABLE IF NOT EXISTS weather_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    humidity INT NULL,
    rainfall DECIMAL(6, 2) NULL DEFAULT 0.00,
    wind_speed DECIMAL(5, 2) NULL,
    weather_condition VARCHAR(100) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_weather_records_user
        FOREIGN KEY (user_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    INDEX idx_weather_user_time (user_id, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
