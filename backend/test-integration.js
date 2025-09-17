#!/usr/bin/env node

/**
 * Integration Test Runner with Real MySQL Database
 * 
 * This script runs tests against your real MySQL database to get 
 * more accurate pass rates than mocked database tests.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Integration Tests with Real MySQL Database\n');

// Set environment to use real database instead of mocks
const testEnv = {
  ...process.env,
  NODE_ENV: 'integration', // Use 'integration' instead of 'test' to avoid mocking
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root', 
  DB_PASSWORD: process.env.DB_PASSWORD || 'thisisREALLYIT29!',
  DB_NAME: process.env.DB_NAME || 'reved_kids', // Use your existing seeded database
  REDIS_ENABLED: 'false', // Disable Redis for simpler setup
  JWT_SECRET: 'integration-test-jwt-secret-key-32-chars',
  JWT_REFRESH_SECRET: 'integration-test-jwt-refresh-secret-32-chars',
  ENCRYPTION_KEY: 'integrationtest32charabcdefghij',
  COOKIE_SECRET: 'integration-test-cookie-secret-32-chars',
  // Relaxed rate limits for testing
  RATE_LIMIT_MAX: '10000',
  RATE_LIMIT_AUTH_MAX: '1000',
  RATE_LIMIT_GLOBAL_MAX: '50000',
  // Enable logging for better debugging
  LOG_LEVEL: 'info'
};

console.log('📋 Integration Test Configuration:');
console.log(`   Database: ${testEnv.DB_HOST}:3306/${testEnv.DB_NAME}`);
console.log(`   User: ${testEnv.DB_USER}`);
console.log(`   Redis: ${testEnv.REDIS_ENABLED}`);
console.log('');

// Run vitest with integration environment
const vitestProcess = spawn('npx', ['vitest', 'run', '--reporter=verbose'], {
  env: testEnv,
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

vitestProcess.on('close', (code) => {
  console.log('\n' + '='.repeat(60));
  if (code === 0) {
    console.log('✅ Integration Tests Completed Successfully!');
    console.log('💡 Real database testing shows true production readiness.');
  } else {
    console.log(`❌ Integration Tests Failed with exit code: ${code}`);
    console.log('💡 Check database connection and schema setup.');
  }
  console.log('='.repeat(60));
  process.exit(code);
});

vitestProcess.on('error', (error) => {
  console.error('❌ Failed to start integration tests:', error.message);
  console.log('\n💡 Make sure you have:');
  console.log('   1. MySQL server running');
  console.log('   2. Database "reved_kids_integration" created');
  console.log('   3. Correct credentials in .env file');
  process.exit(1);
});