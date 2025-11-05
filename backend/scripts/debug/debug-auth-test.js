#!/usr/bin/env node

/**
 * Debug Authentication Test
 * Test the exact login flow that the students test is trying to use
 */

const { spawn } = require('child_process');

console.log('🔍 Debugging Authentication Test Flow...\n');

// Create a simple test script that mimics what students.test.ts does
const testScript = `
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from './setup';

describe('Debug Auth Flow', () => {
  it('should debug registration and login', async () => {
    console.log('🔧 Testing registration...');
    
    // Register 
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        prenom: 'TestUser',
        nom: 'Debug',
        email: 'debug@test.com',
        password: 'test-password-123456',
        dateNaissance: '2015-05-15',
        niveauActuel: 'CP'
      }
    });
    
    console.log('📝 Register response status:', registerResponse.statusCode);
    console.log('📝 Register response body:', registerResponse.body);
    
    if (registerResponse.statusCode !== 201) {
      console.log('❌ Registration failed!');
      return;
    }
    
    console.log('🔧 Testing login...');
    
    // Login - try the exact same format as students.test.ts
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        prenom: 'TestUser',
        nom: 'Debug', 
        password: 'test-password-123456'
      }
    });
    
    console.log('🔑 Login response status:', loginResponse.statusCode);
    console.log('🔑 Login response body:', loginResponse.body);
    
    if (loginResponse.statusCode !== 200) {
      console.log('❌ Login failed!');
      
      // Try email login instead
      console.log('🔧 Trying email login...');
      const emailLoginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'debug@test.com',
          password: 'test-password-123456'
        }
      });
      
      console.log('📧 Email login status:', emailLoginResponse.statusCode);
      console.log('📧 Email login body:', emailLoginResponse.body);
    }
    
    expect(true).toBe(true); // Just to make test pass
  });
});
`;

// Write the test file
const fs = require('fs');
const path = require('path');
const testFile = path.join(__dirname, 'src', 'tests', 'debug-auth.test.ts');

fs.writeFileSync(testFile, testScript);

console.log('📝 Created debug test file');
console.log('🚀 Running debug test...\n');

// Run the debug test
const testProcess = spawn('npx', ['vitest', 'run', 'src/tests/debug-auth.test.ts'], {
  env: { ...process.env, NODE_ENV: 'test' },
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

testProcess.on('close', (code) => {
  // Clean up the test file
  try {
    fs.unlinkSync(testFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  console.log('\n🎯 Debug test completed');
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Failed to run debug test:', error.message);
  process.exit(1);
});