#!/usr/bin/env node

/**
 * Script to generate a secure admin key for the backend
 * Run with: node scripts/generate-admin-key.js
 */

const crypto = require('crypto');

function generateAdminKey() {
  // Generate a secure random key (32 bytes = 256 bits)
  const key = crypto.randomBytes(32).toString('hex');
  
  console.log('\n🔑 Generated Admin Secret Key:\n');
  console.log('─'.repeat(70));
  console.log(key);
  console.log('─'.repeat(70));
  console.log('\nAdd this to your backend/.env file:\n');
  console.log(`ADMIN_SECRET_KEY=${key}`);
  console.log('\n⚠️  Keep this key secure and never commit it to version control!\n');
}

generateAdminKey();
