// REAL APP TEST SETUP - Test against actual application logic
import { beforeAll, afterAll, vi } from 'vitest';
import { build } from '../app-test';
import type { FastifyInstance } from 'fastify';

// Only mock external dependencies
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn()
}));

vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Global test variables
let app: FastifyInstance;

beforeAll(async () => {
  app = await build();
  await app.ready();
  console.log('✅ Real app built and ready for testing');
});

afterAll(async () => {
  if (app) {
    await app.close();
    console.log('✅ App closed after tests');
  }
});

export { app };



