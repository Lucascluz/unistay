import { pool } from './config';

const migrations = [
  // Migration 1: Create users table
  `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `,

  // Migration 1.5: Create admins table
  `
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
  `,

  // Migration 2: Create reviews table
  `
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      location VARCHAR(255) NOT NULL,
      property VARCHAR(255) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review TEXT NOT NULL,
      helpful INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_reviews_location ON reviews(location);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
  `,

  // Migration 3: Create companies table
  `
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      company_type VARCHAR(50) NOT NULL CHECK (company_type IN ('landlord', 'housing_platform', 'university')),
      verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
      verification_token VARCHAR(255),
      verification_document_url TEXT,
      tax_id VARCHAR(100),
      website VARCHAR(500),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
    CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON companies(verification_status);
    CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(company_type);
  `,

  // Migration 4: Create company_representatives table
  `
    CREATE TABLE IF NOT EXISTS company_representatives (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      user_email VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL,
      is_primary BOOLEAN DEFAULT false,
      verified BOOLEAN DEFAULT false,
      verification_token VARCHAR(255),
      verification_sent_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_company_representatives_company_id ON company_representatives(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_representatives_email ON company_representatives(user_email);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_company_representatives_unique ON company_representatives(company_id, user_email);
  `,

  // Migration 5: Create review_responses table
  `
    CREATE TABLE IF NOT EXISTS review_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      response_text TEXT NOT NULL,
      is_company_response BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CHECK (
        (is_company_response = true AND company_id IS NOT NULL AND user_id IS NULL) OR
        (is_company_response = false AND user_id IS NOT NULL AND company_id IS NULL)
      )
    );
    
    CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
    CREATE INDEX IF NOT EXISTS idx_review_responses_user_id ON review_responses(user_id);
    CREATE INDEX IF NOT EXISTS idx_review_responses_company_id ON review_responses(company_id);
    CREATE INDEX IF NOT EXISTS idx_review_responses_created_at ON review_responses(created_at);
  `,

  // Migration 6: Create migrations tracking table
  `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Migration 7: Create company verification actions log
  `
    CREATE TABLE IF NOT EXISTS company_verification_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
      action VARCHAR(50) NOT NULL CHECK (action IN ('verified', 'rejected', 'pending')),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_verification_actions_company_id ON company_verification_actions(company_id);
    CREATE INDEX IF NOT EXISTS idx_verification_actions_admin_id ON company_verification_actions(admin_id);
    CREATE INDEX IF NOT EXISTS idx_verification_actions_created_at ON company_verification_actions(created_at DESC);
  `,
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running database migrations...');
    
    for (let i = 0; i < migrations.length; i++) {
      await client.query('BEGIN');
      try {
        await client.query(migrations[i]);
        console.log(`✓ Migration ${i + 1} completed`);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`✗ Migration ${i + 1} failed:`, error);
        throw error;
      }
    }
    
    console.log('✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
