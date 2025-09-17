/**
 * Unit tests for monitoring utilities
 * Tests Prometheus metrics, health checks, and performance monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as prometheus from 'prom-client';
import {
  initializeMonitoring,
  recordDatabaseQuery,
  recordRedisOperation,
  recordUserRegistration,
  recordLessonCompletion,
  recordActiveUser,
  recordKioskModeSession,
  recordDatabaseConnection,
  recordDatabaseConnectionTotal,
  getCustomMetric,
  incrementCustomCounter,
  setCustomGauge,
  observeCustomHistogram,
  measureAsync,
  httpRequestDuration,
  httpRequestTotal,
  httpRequestInProgress,
  dbQueryDuration,
  dbConnectionsActive,
  redisOperationDuration,
  userRegistrations,
  lessonCompletions,
  activeUsers,
  kioskModeSessions,
  memoryUsage,
  cpuUsage,
  eventLoopLag
} from '../monitoring';

// Mock logger
vi.mock('../../jobs/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock prometheus
vi.mock('prom-client', () => ({
  register: {
    metrics: vi.fn().mockResolvedValue('mocked metrics'),
    contentType: 'text/plain; version=0.0.4; charset=utf-8'
  },
  Counter: vi.fn().mockImplementation((config) => ({
    inc: vi.fn(),
    name: config.name,
    help: config.help,
    labelNames: config.labelNames || []
  })),
  Gauge: vi.fn().mockImplementation((config) => ({
    set: vi.fn(),
    name: config.name,
    help: config.help,
    labelNames: config.labelNames || []
  })),
  Histogram: vi.fn().mockImplementation((config) => ({
    observe: vi.fn(),
    name: config.name,
    help: config.help,
    labelNames: config.labelNames || [],
    buckets: config.buckets || []
  }))
}));

// Mock process
const mockProcess = {
  memoryUsage: vi.fn().mockReturnValue({
    rss: 100000000,
    heapUsed: 50000000,
    heapTotal: 80000000,
    external: 10000000
  }),
  cpuUsage: vi.fn().mockReturnValue({
    user: 100000,
    system: 50000
  }),
  hrtime: vi.fn().mockReturnValue([1, 500000000]),
  uptime: vi.fn().mockReturnValue(3600) // 1 hour
};

Object.defineProperty(global, 'process', {
  value: mockProcess,
  writable: true
});

// Mock setInterval and clearInterval
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();
const mockSetImmediate = vi.fn();

Object.defineProperty(global, 'setInterval', {
  value: mockSetInterval,
  writable: true
});

Object.defineProperty(global, 'clearInterval', {
  value: mockClearInterval,
  writable: true
});

Object.defineProperty(global, 'setImmediate', {
  value: mockSetImmediate,
  writable: true
});

describe('Monitoring Utils', () => {
  let mockApp: Partial<FastifyInstance>;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockReply = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      statusCode: 200
    };

    mockRequest = {
      method: 'GET',
      url: '/test',
      routeOptions: { url: '/test' },
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1'
    };

    mockApp = {
      get: vi.fn(),
      addHook: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Metric Recording Functions', () => {
    describe('recordDatabaseQuery', () => {
      it('should record database query metrics', () => {
        const operation = 'SELECT';
        const table = 'students';
        const duration = 0.5;

        recordDatabaseQuery(operation, table, duration);

        expect(dbQueryDuration.observe).toHaveBeenCalledWith(
          { operation, table },
          duration
        );
      });

      it('should handle various operation types', () => {
        const operations = ['INSERT', 'UPDATE', 'DELETE', 'SELECT'];
        operations.forEach(operation => {
          recordDatabaseQuery(operation, 'test_table', 0.1);
          expect(dbQueryDuration.observe).toHaveBeenCalledWith(
            { operation, table: 'test_table' },
            0.1
          );
        });
      });
    });

    describe('recordRedisOperation', () => {
      it('should record Redis operation metrics', () => {
        const operation = 'GET';
        const duration = 0.01;
        const status = 'success';

        recordRedisOperation(operation, duration, status);

        expect(redisOperationDuration.observe).toHaveBeenCalledWith(
          { operation },
          duration
        );
        expect(redisOperationsTotal.inc).toHaveBeenCalledWith({
          operation,
          status
        });
      });

      it('should handle error status', () => {
        recordRedisOperation('SET', 0.02, 'error');

        expect(redisOperationDuration.observe).toHaveBeenCalledWith(
          { operation: 'SET' },
          0.02
        );
        expect(redisOperationsTotal.inc).toHaveBeenCalledWith({
          operation: 'SET',
          status: 'error'
        });
      });
    });

    describe('recordUserRegistration', () => {
      it('should increment user registration counter', () => {
        recordUserRegistration();
        expect(userRegistrations.inc).toHaveBeenCalled();
      });
    });

    describe('recordLessonCompletion', () => {
      it('should record lesson completion with labels', () => {
        const lessonType = 'reading';
        const difficulty = 'easy';

        recordLessonCompletion(lessonType, difficulty);

        expect(lessonCompletions.inc).toHaveBeenCalledWith({
          lesson_type: lessonType,
          difficulty
        });
      });
    });

    describe('recordActiveUser', () => {
      it('should set active user count', () => {
        const count = 42;
        recordActiveUser(count);
        expect(activeUsers.set).toHaveBeenCalledWith(count);
      });
    });

    describe('recordKioskModeSession', () => {
      it('should categorize short sessions', () => {
        recordKioskModeSession(15);
        expect(kioskModeSessions.inc).toHaveBeenCalledWith({
          duration_range: 'short'
        });
      });

      it('should categorize medium sessions', () => {
        recordKioskModeSession(45);
        expect(kioskModeSessions.inc).toHaveBeenCalledWith({
          duration_range: 'medium'
        });
      });

      it('should categorize long sessions', () => {
        recordKioskModeSession(90);
        expect(kioskModeSessions.inc).toHaveBeenCalledWith({
          duration_range: 'long'
        });
      });
    });

    describe('recordDatabaseConnection', () => {
      it('should set active database connections', () => {
        const activeCount = 5;
        recordDatabaseConnection(activeCount);
        expect(dbConnectionsActive.set).toHaveBeenCalledWith(activeCount);
      });
    });

    describe('recordDatabaseConnectionTotal', () => {
      it('should increment total database connections', () => {
        recordDatabaseConnectionTotal();
        expect(dbConnectionsTotal.inc).toHaveBeenCalled();
      });
    });
  });

  describe('Custom Metrics', () => {
    beforeEach(() => {
      // Clear the custom metrics map
      (getCustomMetric as any).customMetrics?.clear();
    });

    describe('getCustomMetric', () => {
      it('should return undefined for non-existent metric', () => {
        const result = getCustomMetric('non_existent');
        expect(result).toBeUndefined();
      });
    });

    describe('incrementCustomCounter', () => {
      it('should not throw for non-existent counter', () => {
        expect(() => {
          incrementCustomCounter('non_existent');
        }).not.toThrow();
      });

      it('should increment counter with labels', () => {
        const mockCounter = { inc: vi.fn() };
        (getCustomMetric as any).customMetrics?.set('test_counter', mockCounter);
        
        incrementCustomCounter('test_counter', { label: 'value' });
        expect(mockCounter.inc).toHaveBeenCalledWith({ label: 'value' });
      });
    });

    describe('setCustomGauge', () => {
      it('should not throw for non-existent gauge', () => {
        expect(() => {
          setCustomGauge('non_existent', 100);
        }).not.toThrow();
      });

      it('should set gauge value with labels', () => {
        const mockGauge = { set: vi.fn() };
        (getCustomMetric as any).customMetrics?.set('test_gauge', mockGauge);
        
        setCustomGauge('test_gauge', 50, { type: 'test' });
        expect(mockGauge.set).toHaveBeenCalledWith({ type: 'test' }, 50);
      });
    });

    describe('observeCustomHistogram', () => {
      it('should not throw for non-existent histogram', () => {
        expect(() => {
          observeCustomHistogram('non_existent', 1.5);
        }).not.toThrow();
      });

      it('should observe histogram value with labels', () => {
        const mockHistogram = { observe: vi.fn() };
        (getCustomMetric as any).customMetrics?.set('test_histogram', mockHistogram);
        
        observeCustomHistogram('test_histogram', 2.5, { operation: 'test' });
        expect(mockHistogram.observe).toHaveBeenCalledWith({ operation: 'test' }, 2.5);
      });
    });
  });

  describe('Performance Monitoring', () => {
    describe('measureAsync', () => {
      it('should measure successful async operations', async () => {
        const operation = 'test_operation';
        const mockFn = vi.fn().mockResolvedValue('success');
        const mockSuccessMetric = { observe: vi.fn() };
        
        vi.spyOn(Date, 'now')
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(1500);

        const result = await measureAsync(operation, mockFn);

        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalled();
      });

      it('should measure failed async operations and rethrow error', async () => {
        const operation = 'test_operation';
        const error = new Error('Test error');
        const mockFn = vi.fn().mockRejectedValue(error);
        
        vi.spyOn(Date, 'now')
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(1200);

        await expect(measureAsync(operation, mockFn)).rejects.toThrow('Test error');
        expect(mockFn).toHaveBeenCalled();
      });

      it('should handle labels correctly', async () => {
        const operation = 'test_operation';
        const mockFn = vi.fn().mockResolvedValue('success');
        const labels = { service: 'test', version: 'v1' };

        await measureAsync(operation, mockFn, labels);

        expect(mockFn).toHaveBeenCalled();
      });
    });
  });

  describe('initializeMonitoring', () => {
    it('should register metrics endpoint', () => {
      initializeMonitoring(mockApp as FastifyInstance);

      expect(mockApp.get).toHaveBeenCalledWith('/metrics', expect.any(Function));
    });

    it('should register health check endpoints', () => {
      initializeMonitoring(mockApp as FastifyInstance);

      expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/health/detailed', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/ready', expect.any(Function));
    });

    it('should setup request monitoring hooks', () => {
      initializeMonitoring(mockApp as FastifyInstance);

      expect(mockApp.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
      expect(mockApp.addHook).toHaveBeenCalledWith('onResponse', expect.any(Function));
    });

    it('should setup system monitoring intervals', () => {
      initializeMonitoring(mockApp as FastifyInstance);

      // Should setup intervals for memory, CPU, and event loop monitoring
      expect(mockSetInterval).toHaveBeenCalledTimes(3);
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 30000); // Memory and CPU
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000); // Event loop
    });
  });

  describe('Health Check Endpoints', () => {
    let metricsHandler: Function;
    let healthHandler: Function;
    let detailedHealthHandler: Function;
    let readyHandler: Function;

    beforeEach(() => {
      initializeMonitoring(mockApp as FastifyInstance);
      
      // Extract the handlers from the mock calls
      const getCalls = (mockApp.get as MockedFunction<any>).mock.calls;
      metricsHandler = getCalls.find(call => call[0] === '/metrics')?.[1];
      healthHandler = getCalls.find(call => call[0] === '/health')?.[1];
      detailedHealthHandler = getCalls.find(call => call[0] === '/health/detailed')?.[1];
      readyHandler = getCalls.find(call => call[0] === '/ready')?.[1];
    });

    describe('metrics endpoint', () => {
      it('should return prometheus metrics', async () => {
        const result = await metricsHandler(mockRequest, mockReply);

        expect(mockReply.header).toHaveBeenCalledWith(
          'Content-Type',
          'text/plain; version=0.0.4; charset=utf-8'
        );
        expect(result).toBe('mocked metrics');
      });

      it('should handle metrics generation errors', async () => {
        const prometheusRegister = prometheus.register as any;
        prometheusRegister.metrics.mockRejectedValueOnce(new Error('Metrics error'));

        await metricsHandler(mockRequest, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(500);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Failed to generate metrics'
        });
      });
    });

    describe('health endpoint', () => {
      it('should return healthy status', async () => {
        await healthHandler(mockRequest, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(200);
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'healthy',
            frontends: {
              'CM1/CM2': 'http://localhost:3000',
              'CP/CE1/CE2': 'http://localhost:3001'
            },
            version: '2.0.0'
          })
        );
      });

      it('should handle health check errors', async () => {
        // Mock a health check failure
        vi.spyOn(mockProcess, 'memoryUsage').mockImplementationOnce(() => {
          throw new Error('Memory check failed');
        });

        await healthHandler(mockRequest, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(503);
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'unhealthy',
            error: 'Health check failed'
          })
        );
      });
    });

    describe('detailed health endpoint', () => {
      it('should return detailed health information', async () => {
        await detailedHealthHandler(mockRequest, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(200);
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'healthy',
            timestamp: expect.any(String),
            checks: expect.objectContaining({
              database: expect.any(Object),
              redis: expect.any(Object),
              memory: expect.any(Object),
              uptime: expect.any(Object),
              disk: expect.any(Object),
              network: expect.any(Object)
            })
          })
        );
      });
    });

    describe('readiness endpoint', () => {
      it('should return ready status', async () => {
        await readyHandler(mockRequest, mockReply);

        expect(mockReply.status).toHaveBeenCalledWith(200);
        expect(mockReply.send).toHaveBeenCalledWith(
          expect.objectContaining({
            ready: true,
            timestamp: expect.any(String),
            checks: expect.objectContaining({
              database: expect.any(Object),
              redis: expect.any(Object),
              application: expect.any(Object)
            })
          })
        );
      });
    });
  });

  describe('Request Monitoring Hooks', () => {
    let onRequestHook: Function;
    let onResponseHook: Function;

    beforeEach(() => {
      initializeMonitoring(mockApp as FastifyInstance);
      
      const hookCalls = (mockApp.addHook as MockedFunction<any>).mock.calls;
      onRequestHook = hookCalls.find(call => call[0] === 'onRequest')?.[1];
      onResponseHook = hookCalls.find(call => call[0] === 'onResponse')?.[1];
    });

    describe('onRequest hook', () => {
      it('should track request start time and increment in-progress counter', async () => {
        const mockDate = 1234567890;
        vi.spyOn(Date, 'now').mockReturnValue(mockDate);

        await onRequestHook(mockRequest);

        expect(httpRequestInProgress.inc).toHaveBeenCalledWith({
          method: 'GET',
          route: '/test'
        });
        expect((mockRequest as any).startTime).toBe(mockDate);
      });

      it('should handle missing route options', async () => {
        const requestWithoutRoute = { ...mockRequest, routeOptions: undefined };
        
        await onRequestHook(requestWithoutRoute);

        expect(httpRequestInProgress.inc).toHaveBeenCalledWith({
          method: 'GET',
          route: '/test'
        });
      });
    });

    describe('onResponse hook', () => {
      it('should record response metrics', async () => {
        const startTime = 1000;
        const endTime = 1500;
        (mockRequest as any).startTime = startTime;
        
        vi.spyOn(Date, 'now').mockReturnValue(endTime);

        await onResponseHook(mockRequest, mockReply);

        expect(httpRequestDuration.observe).toHaveBeenCalledWith(
          { method: 'GET', route: '/test', status_code: 200 },
          0.5
        );
        expect(httpRequestTotal.inc).toHaveBeenCalledWith({
          method: 'GET',
          route: '/test',
          status_code: 200
        });
        expect(httpRequestInProgress.dec).toHaveBeenCalledWith({
          method: 'GET',
          route: '/test'
        });
      });

      it('should log slow requests', async () => {
        const { logger } = await import('../logger');
        const startTime = 1000;
        const endTime = 7000; // 6 second request
        (mockRequest as any).startTime = startTime;
        
        vi.spyOn(Date, 'now').mockReturnValue(endTime);

        await onResponseHook(mockRequest, mockReply);

        expect(logger.warn).toHaveBeenCalledWith(
          'Slow request detected',
          expect.objectContaining({
            method: 'GET',
            route: '/test',
            duration: 6,
            statusCode: 200,
            userAgent: 'test-agent',
            ip: '127.0.0.1'
          })
        );
      });
    });
  });

  describe('System Monitoring Setup', () => {
    it('should collect memory usage metrics', () => {
      initializeMonitoring(mockApp as FastifyInstance);

      // Find the memory monitoring interval callback
      const memoryCallback = mockSetInterval.mock.calls.find(
        call => call[1] === 30000
      )?.[0];

      if (memoryCallback) {
        memoryCallback();

        expect(memoryUsage.set).toHaveBeenCalledWith({ type: 'rss' }, 100000000);
        expect(memoryUsage.set).toHaveBeenCalledWith({ type: 'heapUsed' }, 50000000);
        expect(memoryUsage.set).toHaveBeenCalledWith({ type: 'heapTotal' }, 80000000);
        expect(memoryUsage.set).toHaveBeenCalledWith({ type: 'external' }, 10000000);
      }
    });

    it('should collect CPU usage metrics', () => {
      initializeMonitoring(mockApp as FastifyInstance);

      // Find the CPU monitoring interval callback (second call with 30000ms)
      const cpuCallback = mockSetInterval.mock.calls.filter(
        call => call[1] === 30000
      )?.[1]?.[0];

      if (cpuCallback) {
        // Reset mocks to capture the second set of calls
        vi.clearAllMocks();
        mockProcess.cpuUsage.mockReturnValue({ user: 200000, system: 100000 });
        mockProcess.hrtime.mockReturnValue([2, 0]);

        cpuCallback();

        expect(cpuUsage.set).toHaveBeenCalled();
      }
    });

    it('should collect event loop lag metrics', () => {
      initializeMonitoring(mockApp as FastifyInstance);

      // Find the event loop monitoring interval callback
      const eventLoopCallback = mockSetInterval.mock.calls.find(
        call => call[1] === 1000
      )?.[0];

      if (eventLoopCallback) {
        eventLoopCallback();
        expect(mockSetImmediate).toHaveBeenCalled();

        // Simulate the setImmediate callback
        const immediateCallback = mockSetImmediate.mock.calls[0][0];
        immediateCallback();

        expect(eventLoopLag.observe).toHaveBeenCalled();
      }
    });
  });
});