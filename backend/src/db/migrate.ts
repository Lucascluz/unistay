import { Pool } from 'pg';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true, // Neon uses proper SSL certificates
  },
  // Connection settings for reliability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

interface Migration {
  id: number;
  name: string;
  executedAt: Date;
}

/**
 * Test database connection
 */
async function testConnection(): Promise<boolean> {
  console.log('🔌 Testing database connection...');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful!');
    console.log(`   Server time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    return false;
  }
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations tracking table ready');
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<Migration>(
      'SELECT name FROM schema_migrations ORDER BY id ASC'
    );
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('❌ Failed to fetch executed migrations:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get list of migration files from migrations directory
 */
function getMigrationFiles(): string[] {
  const migrationsDir = path.join(__dirname, '../../migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found');
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensures they run in order (001_, 002_, etc.)

  return files;
}

/**
 * Execute a single migration file
 */
async function executeMigration(filename: string): Promise<void> {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  const client = await pool.connect();
  try {
    console.log(`   Running: ${filename}`);
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(sql);
    
    // Record migration as executed
    await client.query(
      'INSERT INTO schema_migrations (name) VALUES ($1)',
      [filename]
    );
    
    await client.query('COMMIT');
    console.log(`   ✅ ${filename} completed`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`   ❌ ${filename} failed:`);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main migration runner
 */
async function runMigrations(): Promise<void> {
  console.log('\n🚀 UniStay Database Migration Tool\n');
  console.log('='.repeat(50));

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('\n❌ Cannot proceed without database connection');
    console.error('   Check your DATABASE_URL in .env file');
    process.exit(1);
  }

  console.log('='.repeat(50));

  try {
    // Create migrations tracking table
    await createMigrationsTable();

    // Get lists of migrations
    const availableMigrations = getMigrationFiles();
    const executedMigrations = await getExecutedMigrations();

    // Find pending migrations
    const pendingMigrations = availableMigrations.filter(
      migration => !executedMigrations.includes(migration)
    );

    console.log('\n📊 Migration Status:');
    console.log(`   Total migrations: ${availableMigrations.length}`);
    console.log(`   Already executed: ${executedMigrations.length}`);
    console.log(`   Pending: ${pendingMigrations.length}`);

    if (pendingMigrations.length === 0) {
      console.log('\n✅ Database is up to date! No migrations to run.');
      return;
    }

    console.log('\n🔄 Running pending migrations:\n');

    // Run pending migrations in order
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All migrations completed successfully!');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ Migration failed!');
    console.error('='.repeat(50) + '\n');
    throw error;
  }
}

/**
 * Graceful shutdown
 */
async function cleanup(): Promise<void> {
  await pool.end();
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      cleanup();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nFull error details:', error);
      cleanup();
      process.exit(1);
    });
}

export { runMigrations, testConnection };
