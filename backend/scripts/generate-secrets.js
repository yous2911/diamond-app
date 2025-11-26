#!/usr/bin/env node
/**
 * Generate secure secrets for production deployment
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Generating secure secrets for production...\n');

// Generate secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(16).toString('hex'); // Must be exactly 32 chars (16 bytes = 32 hex chars)
const cookieSecret = crypto.randomBytes(32).toString('hex');

console.log('Copy these values to your env.backend file:\n');
console.log('='.repeat(60));
console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);
console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('COOKIE_SECRET=' + cookieSecret);
console.log('='.repeat(60));

console.log('\n✅ Secrets generated successfully!');
console.log('⚠️  IMPORTANT: Store these securely and never commit them to git!');
console.log('⚠️  Use different secrets for development, staging, and production!');

