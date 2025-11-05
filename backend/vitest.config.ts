// vitest.config.ts - Backend test configuration
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    pool: 'threads',
    isolate: false,
    clearMocks: true,
    restoreMocks: false,
    unstubEnvs: true,
    maxConcurrency: 1,
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 30000,
    sequence: {
      hooks: 'stack'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
