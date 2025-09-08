// src/tests/setup.ts - Real database test setup
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { build } from '../app-test';
import { connectDatabase, disconnectDatabase, getDatabase } from '../db/connection';
import { setupDatabase } from '../db/setup';
import type { FastifyInstance } from 'fastify';

export let app: FastifyInstance;
let setupComplete = false;

// Test user credentials
export const TEST_AUTH_TOKEN = 'Bearer test-jwt-token-for-testing-' + Date.now();
export const TEST_USER = {
  id: 'test-user-123',
  email: 'test@example.com',
  role: 'admin'
};

beforeAll(async () => {
  if (setupComplete) {
    return;
  }
  
  try {
    console.log('🧪 Setting up test environment with REAL database...');
    
    // Connect to real test database
    await connectDatabase();
    
    // Setup database schema and seed test data
    await setupDatabase();
    
    // Build the app
    if (!app) {
      app = await build();
      await app.ready();
    }
    
    setupComplete = true;
    console.log('✅ Test environment setup complete - using REAL database');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

beforeEach(async () => {
  // Clean up test data between tests if needed
  // For now we'll keep it simple - each test should use unique data
});

afterAll(async () => {
  if (app && setupComplete) {
    await app.close();
    await disconnectDatabase();
    setupComplete = false;
  }
});