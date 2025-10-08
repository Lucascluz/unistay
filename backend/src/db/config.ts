import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Determine if we need SSL (for external Render connections)
const isProduction = process.env.NODE_ENV === 'production';
const isRenderExternal = process.env.DATABASE_URL?.includes('render.com');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRenderExternal ? {
    rejectUnauthorized: false, // Render uses self-signed certificates
  } : false,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});
