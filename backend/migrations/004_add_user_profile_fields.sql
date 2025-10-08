-- Migration 004: Add User Profile Fields
-- Adds nationality, gender, birth_date, and trust score related fields to users table

BEGIN;

-- Add profile fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS data_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS anonymized_data_opt_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS profile_completion_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS number_of_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS number_of_helpful_votes_received INTEGER DEFAULT 0;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_users_nationality ON users(nationality);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score DESC);

-- Add comment for documentation
COMMENT ON COLUMN users.nationality IS 'User nationality for demographics';
COMMENT ON COLUMN users.gender IS 'User gender identity';
COMMENT ON COLUMN users.birth_date IS 'User date of birth';
COMMENT ON COLUMN users.trust_score IS 'Calculated trust score (0-100)';
COMMENT ON COLUMN users.profile_completion_percentage IS 'Profile completion percentage (0-100)';

COMMIT;
