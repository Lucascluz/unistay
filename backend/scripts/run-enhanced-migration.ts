import { pool } from '../src/db/config';
import * as fs from 'fs';
import * as path from 'path';

async function runEnhancedMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running enhanced type system migration...');
    console.log('⚠️  This will add new columns and tables to your database.');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../migrations/001_enhanced_type_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by transaction boundaries if needed
    await client.query('BEGIN');
    
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Enhanced type system migration completed successfully!');
      console.log('');
      console.log('New features added:');
      console.log('  • User demographics and academic data');
      console.log('  • Company metrics and trust scoring');
      console.log('  • Enhanced reviews with sentiment and categories');
      console.log('  • Analytics tables (behavior events, insights, mobility)');
      console.log('  • Automatic triggers for stats updates');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Update your API endpoints to use new fields');
      console.log('  2. Update frontend forms to collect new data');
      console.log('  3. Review IMPLEMENTATION_GUIDE.md for details');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', error);
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

// Run if executed directly
if (require.main === module) {
  runEnhancedMigration();
}

export { runEnhancedMigration };
