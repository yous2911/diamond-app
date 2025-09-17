// vitest.unit.config.ts - Unit test configuration (no setup file)
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // NO setupFiles - unit tests should be isolated
    pool: 'forks',
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    maxConcurrency: 1, // Run unit tests sequentially for better isolation
    testTimeout: 10000,
    hookTimeout: 5000,
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
