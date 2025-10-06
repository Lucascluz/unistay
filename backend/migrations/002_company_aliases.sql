-- Migration: Company Aliases System
-- This enables handling of alternative names, misspellings, and different naming conventions
-- for companies/institutions (universities, housing platforms, etc.)

-- Company Aliases Table
CREATE TABLE IF NOT EXISTS company_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The alias/alternative name
  alias_name VARCHAR(255) NOT NULL,
  alias_name_normalized VARCHAR(255) NOT NULL, -- Lowercase, trimmed for matching
  
  -- Link to company (nullable for pre-registration aliases)
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Type of alias
  alias_type VARCHAR(50) NOT NULL DEFAULT 'common_name' CHECK (
    alias_type IN (
      'common_name',      -- IPG for Instituto Politécnico da Guarda
      'abbreviation',     -- MIT for Massachusetts Institute of Technology
      'misspelling',      -- Common misspellings
      'translation',      -- Different language versions
      'former_name',      -- Previous official names
      'local_name'        -- Local/informal names
    )
  ),
  
  -- Priority for matching (higher = preferred)
  priority INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_aliases_normalized ON company_aliases(alias_name_normalized);
CREATE INDEX IF NOT EXISTS idx_company_aliases_company_id ON company_aliases(company_id);
CREATE INDEX IF NOT EXISTS idx_company_aliases_active ON company_aliases(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_company_aliases_unlinked ON company_aliases(company_id) WHERE company_id IS NULL;

-- Ensure uniqueness of active aliases
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_aliases_unique_normalized 
  ON company_aliases(alias_name_normalized) 
  WHERE is_active = true;

-- Company Alias Suggestions Table (for pending/unlinked aliases)
CREATE TABLE IF NOT EXISTS company_alias_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The suggested alias
  suggested_name VARCHAR(255) NOT NULL,
  suggested_name_normalized VARCHAR(255) NOT NULL,
  
  -- Context
  suggested_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  context TEXT, -- Where this was encountered (review, search, etc.)
  
  -- Potential matches
  potential_company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'merged')
  ),
  
  -- Admin action
  reviewed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alias_suggestions_status ON company_alias_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_alias_suggestions_normalized ON company_alias_suggestions(suggested_name_normalized);

-- Add official name as default alias when company is created
CREATE OR REPLACE FUNCTION create_default_company_alias()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the official company name as an alias
  INSERT INTO company_aliases (
    alias_name,
    alias_name_normalized,
    company_id,
    alias_type,
    priority,
    is_active
  ) VALUES (
    NEW.name,
    LOWER(TRIM(NEW.name)),
    NEW.id,
    'common_name',
    100, -- Highest priority for official name
    true
  ) ON CONFLICT (alias_name_normalized) WHERE is_active = true DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_company_alias
AFTER INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION create_default_company_alias();

-- Update normalized name on alias change
CREATE OR REPLACE FUNCTION update_alias_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.alias_name_normalized = LOWER(TRIM(NEW.alias_name));
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alias_normalized
BEFORE UPDATE ON company_aliases
FOR EACH ROW
WHEN (OLD.alias_name IS DISTINCT FROM NEW.alias_name)
EXECUTE FUNCTION update_alias_normalized();

-- Function to search companies by alias
CREATE OR REPLACE FUNCTION search_companies_by_alias(search_term TEXT)
RETURNS TABLE(
  company_id UUID,
  company_name VARCHAR,
  matched_alias VARCHAR,
  alias_type VARCHAR,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    ca.alias_name,
    ca.alias_type,
    ca.priority
  FROM company_aliases ca
  JOIN companies c ON ca.company_id = c.id
  WHERE ca.is_active = true
    AND ca.alias_name_normalized LIKE LOWER(TRIM(search_term)) || '%'
  ORDER BY 
    ca.priority DESC,
    LENGTH(ca.alias_name) ASC,
    ca.usage_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Comment documentation
COMMENT ON TABLE company_aliases IS 'Stores alternative names, abbreviations, and misspellings for companies to help with search and data consistency';
COMMENT ON TABLE company_alias_suggestions IS 'Tracks user-submitted company names that need to be mapped to existing companies or aliases';
COMMENT ON COLUMN company_aliases.company_id IS 'Can be NULL for pre-registration aliases that will be linked later';
COMMENT ON COLUMN company_aliases.priority IS 'Higher values appear first in search results; official name should have highest priority';
