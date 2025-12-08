/**
 * Unit tests for Performance Benchmark Service
 * Tests benchmarking functionality, performance metrics, and reporting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { performanceBenchmarkService } from '../services/performance-benchmark.service';
import { connection, getPoolStats } from '../db/connection';
import { promises as fs } from 'fs';

// Mock dependencies
// Database connection is mocked in setup.ts

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn()
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('../db/optimized-queries', () => ({
  optimizedQueries: {
    getStudentWithProgress: vi.fn(),
    getRecommendedExercises: vi.fn()
  }
}));

describe('Performance Benchmark Service', () => {
  let mockConnection: any;
  let mockGetPoolStats: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConnection = vi.mocked(connection);
    mockGetPoolStats = vi.mocked(getPoolStats);

    // Mock environment variables
    process.env.BENCHMARK_ENABLED = 'true';
    process.env.BENCHMARK_OUTPUT_PATH = '/test/benchmarks';
    process.env.BENCHMARK_ITERATIONS = '10';
    process.env.BENCHMARK_WARMUP_ITERATIONS = '3';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);

      await performanceBenchmarkService.initialize();

      expect(mockMkdir).toHaveBeenCalledWith('/test/benchmarks', { recursive: true });
    });

    it('should skip initialization when disabled', async () => {
      process.env.BENCHMARK_ENABLED = 'false';
      
      await performanceBenchmarkService.initialize();
      
      expect(fs.mkdir).not.toHaveBeenCalled();
    });
  });

  describe('benchmark execution', () => {
    beforeEach(async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await performanceBenchmarkService.initialize();
    });

    it('should run database benchmark successfully', async () => {
      mockConnection.execute.mockResolvedValue([[{ count: 100 }]]);
      mockGetPoolStats.mockReturnValue({
        activeConnections: 5,
        idleConnections: 10,
        totalConnections: 15,
        queuedRequests: 0
      });

      const result = await performanceBenchmarkService.runBenchmark('database');

      expect(result).toBeDefined();
      expect(result.suiteId).toBe('database');
      expect(result.results).toBeDefined();
    });

    it('should run API benchmark successfully', async () => {
      const result = await performanceBenchmarkService.runBenchmark('api');

      expect(result).toBeDefined();
      expect(result.suiteId).toBe('api');
    });

    it('should handle benchmark errors gracefully', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Database error'));

      const result = await performanceBenchmarkService.runBenchmark('database');

      expect(result).toBeDefined();
      expect(result.results.some(r => r.status === 'failed')).toBe(true);
    });
  });

  describe('performance metrics', () => {
    it('should measure execution time accurately', async () => {
      const startTime = Date.now();
      
      const result = await performanceBenchmarkService.measureExecutionTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'test result';
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.result).toBe('test result');
      expect(result.duration).toBeGreaterThan(90);
      expect(result.duration).toBeLessThan(duration + 50);
    });

    it('should measure memory usage', async () => {
      const result = await performanceBenchmarkService.measureMemoryUsage(async () => {
        const array = new Array(1000).fill('test');
        return array.length;
      });

      expect(result.result).toBe(1000);
      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage.heapUsed).toBeGreaterThan(0);
    });

    it('should measure CPU usage', async () => {
      const result = await performanceBenchmarkService.measureCPUUsage(async () => {
        // Simulate CPU-intensive work
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += Math.random();
        }
        return sum;
      });

      expect(result.result).toBeDefined();
      expect(result.cpuUsage).toBeDefined();
    });
  });

  describe('reporting', () => {
    beforeEach(async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await performanceBenchmarkService.initialize();
    });

    it('should generate benchmark report', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockResolvedValue(undefined);

      const mockBenchmarkResult = {
        suiteId: 'test-suite',
        suiteName: 'Test Suite',
        startTime: new Date(),
        endTime: new Date(),
        duration: 1000,
        results: [
          {
            testId: 'test-1',
            testName: 'Test 1',
            category: 'database',
            status: 'passed',
            iterations: 10,
            averageTime: 50,
            minTime: 45,
            maxTime: 55,
            throughput: 20,
            memoryUsage: { heapUsed: 1024, heapTotal: 2048 },
            cpuUsage: 25.5,
            errorRate: 0
          }
        ]
      };

      await performanceBenchmarkService.generateReport(mockBenchmarkResult);

      expect(mockWriteFile).toHaveBeenCalled();
      const writeCall = mockWriteFile.mock.calls[0];
      expect(writeCall[0]).toContain('benchmark-report');
      expect(writeCall[1]).toContain('Test Suite');
    });

    it('should handle report generation errors', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockRejectedValue(new Error('Write failed'));

      const mockBenchmarkResult = {
        suiteId: 'test-suite',
        suiteName: 'Test Suite',
        startTime: new Date(),
        endTime: new Date(),
        duration: 1000,
        results: []
      };

      // Should not throw error
      await expect(performanceBenchmarkService.generateReport(mockBenchmarkResult))
        .resolves.toBeUndefined();
    });
  });

  describe('benchmark suites', () => {
    it('should get available benchmark suites', () => {
      const suites = performanceBenchmarkService.getAvailableSuites();

      expect(suites).toBeDefined();
      expect(Array.isArray(suites)).toBe(true);
      expect(suites.length).toBeGreaterThan(0);
    });

    it('should get benchmark suite by ID', () => {
      const suite = performanceBenchmarkService.getBenchmarkSuite('database');

      expect(suite).toBeDefined();
      expect(suite.id).toBe('database');
      expect(suite.tests).toBeDefined();
    });

    it('should return null for non-existent suite', () => {
      const suite = performanceBenchmarkService.getBenchmarkSuite('non-existent');

      expect(suite).toBeNull();
    });
  });

  describe('configuration', () => {
    it('should get current configuration', () => {
      const config = performanceBenchmarkService.getConfiguration();

      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.iterations).toBe(10);
      expect(config.warmupIterations).toBe(3);
    });

    it('should update configuration', () => {
      const newConfig = {
        enabled: true,
        iterations: 20,
        warmupIterations: 5,
        concurrentUsers: [1, 5, 10],
        testDataSizes: [100, 1000],
        timeoutMs: 30000,
        includeBaseline: true,
        generateReport: true,
        outputPath: '/new/path'
      };

      performanceBenchmarkService.updateConfiguration(newConfig);

      const updatedConfig = performanceBenchmarkService.getConfiguration();
      expect(updatedConfig.iterations).toBe(20);
      expect(updatedConfig.warmupIterations).toBe(5);
    });
  });

  describe('cleanup', () => {
    it('should cleanup old benchmark results', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      await performanceBenchmarkService.initialize();

      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockResolvedValue('[]');

      const mockWriteFile = vi.mocked(fs.writeFile);
      mockWriteFile.mockResolvedValue(undefined);

      await performanceBenchmarkService.cleanupOldResults(7); // 7 days

      expect(mockReadFile).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockRejectedValue(new Error('Read failed'));

      await expect(performanceBenchmarkService.cleanupOldResults(7))
        .resolves.toBeUndefined();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      await performanceBenchmarkService.shutdown();

      // Should complete without errors
      expect(true).toBe(true);
    });
  });
});
