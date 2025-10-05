import { pool } from '../src/db/config';
import bcrypt from 'bcrypt';

/**
 * Script to create a test admin user
 * Run with: npm run seed:admin
 */

async function seedAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating test admin user...');
    
    // Test admin credentials
    const name = 'Test Admin';
    const email = 'admin@studystay.com';
    const password = 'admin123'; // Change this in production!
    const role = 'super_admin';
    
    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insert admin user
    const result = await client.query(
      `INSERT INTO admins (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role`,
      [name, email, password_hash, role]
    );
    
    console.log('✓ Admin user created successfully');
    console.log('\nAdmin credentials:');
    console.log('─'.repeat(50));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log('─'.repeat(50));
    console.log('\n⚠️  Change the password in production!\n');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedAdmin();
}

export { seedAdmin };
