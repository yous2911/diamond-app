#!/usr/bin/env node

/**
 * Generate secure production secrets
 * Run: node scripts/generate-production-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Generating Production Secrets\n');
console.log('=' .repeat(60));
console.log('\n⚠️  IMPORTANT: Keep these secrets secure!\n');
console.log('Copy these values to your env.backend file:\n');
console.log('=' .repeat(60));
console.log('\n# SECURITY CONFIGURATION');
console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log(`JWT_REFRESH_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log(`ENCRYPTION_KEY=${crypto.randomBytes(16).toString('hex')}`);
console.log(`COOKIE_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log(`\n# Database Password (generate separately)`);
console.log(`DB_PASSWORD=<your-secure-database-password>`);
console.log('\n' + '=' .repeat(60));
console.log('\n✅ Secrets generated!');
console.log('📋 Next steps:');
console.log('   1. Copy the values above to backend/env.backend');
console.log('   2. Set NODE_ENV=production');
console.log('   3. Update DB_PASSWORD with your actual database password');
console.log('   4. NEVER commit env.backend to git!\n');






