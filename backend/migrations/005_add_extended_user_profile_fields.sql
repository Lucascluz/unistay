-- Migration 005: Add Extended User Profile Fields
-- Adds comprehensive profile fields for student experience tracking

BEGIN;

-- Add extended profile fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS language_preferences TEXT,
ADD COLUMN IF NOT EXISTS current_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS home_university VARCHAR(255),
ADD COLUMN IF NOT EXISTS destination_university VARCHAR(255),
ADD COLUMN IF NOT EXISTS study_field VARCHAR(255),
ADD COLUMN IF NOT EXISTS study_level VARCHAR(100),
ADD COLUMN IF NOT EXISTS study_start_date DATE,
ADD COLUMN IF NOT EXISTS study_end_date DATE,
ADD COLUMN IF NOT EXISTS current_housing_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_currently_renting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_lived_abroad_before BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_users_current_country ON users(current_country);
CREATE INDEX IF NOT EXISTS idx_users_current_city ON users(current_city);
CREATE INDEX IF NOT EXISTS idx_users_study_field ON users(study_field);
CREATE INDEX IF NOT EXISTS idx_users_last_activity_at ON users(last_activity_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN users.language_preferences IS 'Comma-separated list of language preferences';
COMMENT ON COLUMN users.current_country IS 'Country where user is currently located';
COMMENT ON COLUMN users.current_city IS 'City where user is currently located';
COMMENT ON COLUMN users.home_university IS 'Home university name';
COMMENT ON COLUMN users.destination_university IS 'Study abroad destination university';
COMMENT ON COLUMN users.study_field IS 'Field of study';
COMMENT ON COLUMN users.study_level IS 'Level of study (undergraduate, graduate, PhD, etc.)';
COMMENT ON COLUMN users.study_start_date IS 'Study program start date';
COMMENT ON COLUMN users.study_end_date IS 'Study program end date';
COMMENT ON COLUMN users.current_housing_type IS 'Type of current housing';
COMMENT ON COLUMN users.monthly_rent IS 'Monthly rent amount';
COMMENT ON COLUMN users.is_currently_renting IS 'Whether user is currently renting';
COMMENT ON COLUMN users.has_lived_abroad_before IS 'Whether user has lived abroad before';
COMMENT ON COLUMN users.last_activity_at IS 'Last user activity timestamp';

COMMIT;
