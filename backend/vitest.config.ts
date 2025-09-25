// vitest.config.ts - Backend test configuration
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    pool: 'forks',
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    maxConcurrency: 1, // Reduce concurrency to prevent plugin conflicts
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000, // Add teardown timeout
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
