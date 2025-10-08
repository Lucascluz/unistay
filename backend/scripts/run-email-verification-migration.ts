import { pool } from '../src/db/config';
import * as fs from 'fs';
import * as path from 'path';

async function runEmailVerificationMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running email verification migration...');
    
    const migrationPath = path.join(__dirname, '../migrations/003_add_email_verification.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query('BEGIN');
    
    try {
      await client.query(migrationSQL);
      console.log('✓ Email verification migration completed successfully');
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('✗ Email verification migration failed:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runEmailVerificationMigration();
