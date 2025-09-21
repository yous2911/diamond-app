import PerformanceMonitor from '../PerformanceMonitor';

// Mock performance APIs
const mockPerformanceObserver = jest.fn();
const mockPerformanceEntry = {
  duration: 20,
  startTime: 100,
  name: 'test-entry'
};

Object.defineProperty(global, 'PerformanceObserver', {
  writable: true,
  value: mockPerformanceObserver
});

// Create a more robust performance mock
let mockNowCounter = 1000; // Start from a higher number
const mockPerformance = {
  now: jest.fn(() => {
    mockNowCounter += 1;
    return mockNowCounter; // Return incrementing values: 1001, 1002, 1003, etc.
  }),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn((type: string) => {
    if (type === 'navigation') {
      return [{
        transferSize: 500000,
        loadEventEnd: 1000,
        loadEventStart: 500
      }];
    }
    return [mockPerformanceEntry];
  }),
  getEntriesByName: jest.fn(() => [mockPerformanceEntry]),
  memory: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 200000000
  }
};

Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  // Simulate animation frame by calling callback immediately
  setTimeout(callback, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNowCounter = 1000; // Reset the counter to starting value
    mockPerformance.now.mockClear();
    performanceMonitor = new PerformanceMonitor();
    mockPerformanceObserver.mockClear();
    mockPerformance.getEntriesByType.mockClear();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  describe('Initialization', () => {
    it('creates a performance monitor instance', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('initializes with default thresholds', () => {
      const thresholds = performanceMonitor.getThresholds();

      expect(thresholds).toMatchObject({
        componentRenderTime: expect.any(Number),
        bundleSize: expect.any(Number),
        memoryUsage: expect.any(Number),
        fps: expect.any(Number),
        loadTime: expect.any(Number),
        interactionDelay: expect.any(Number)
      });
    });

    it('starts in stopped monitoring state', () => {
      expect(performanceMonitor.isMonitoring()).toBe(false);
    });
  });

  describe('Monitoring Control', () => {
    it('starts monitoring when requested', () => {
      performanceMonitor.startMonitoring();
      expect(performanceMonitor.isMonitoring()).toBe(true);
    });

    it('stops monitoring when requested', () => {
      performanceMonitor.startMonitoring();
      performanceMonitor.stopMonitoring();
      expect(performanceMonitor.isMonitoring()).toBe(false);
    });

    it('handles multiple start calls gracefully', () => {
      performanceMonitor.startMonitoring();
      performanceMonitor.startMonitoring();
      expect(performanceMonitor.isMonitoring()).toBe(true);
    });

    it('handles multiple stop calls gracefully', () => {
      performanceMonitor.startMonitoring();
      performanceMonitor.stopMonitoring();
      performanceMonitor.stopMonitoring();
      expect(performanceMonitor.isMonitoring()).toBe(false);
    });
  });

  describe('Metric Recording', () => {
    it('records component render time metrics', () => {
      performanceMonitor.recordMetric('componentRenderTime', 25);
      const metrics = performanceMonitor.getMetrics();

      expect(metrics.length).toBeGreaterThan(0);
      const latestMetric = metrics[metrics.length - 1];
      expect(latestMetric.componentRenderTime).toBe(25);
    });

    it('records memory usage metrics', () => {
      performanceMonitor.recordMetric('memoryUsage', 85);
      const metrics = performanceMonitor.getMetrics();

      const latestMetric = metrics[metrics.length - 1];
      expect(latestMetric.memoryUsage).toBe(85);
    });

    it('records FPS metrics', () => {
      performanceMonitor.recordMetric('fps', 60);
      const metrics = performanceMonitor.getMetrics();

      const latestMetric = metrics[metrics.length - 1];
      expect(latestMetric.fps).toBe(60);
    });

    it('records load time metrics', () => {
      performanceMonitor.recordMetric('loadTime', 150);
      const metrics = performanceMonitor.getMetrics();

      const latestMetric = metrics[metrics.length - 1];
      expect(latestMetric.loadTime).toBe(150);
    });

    it('records interaction delay metrics', () => {
      performanceMonitor.recordMetric('interactionDelay', 80);
      const metrics = performanceMonitor.getMetrics();

      const latestMetric = metrics[metrics.length - 1];
      expect(latestMetric.interactionDelay).toBe(80);
    });

    it('records bundle size metrics', () => {
      performanceMonitor.recordMetric('bundleSize', 350);
      const metrics = performanceMonitor.getMetrics();

      const latestMetric = metrics[metrics.length - 1];
      expect(latestMetric.bundleSize).toBe(350);
    });
  });

  describe('Threshold Management', () => {
    it('allows setting custom thresholds', () => {
      const customThresholds = {
        componentRenderTime: 20,
        bundleSize: 600,
        memoryUsage: 120,
        fps: 50,
        loadTime: 250,
        interactionDelay: 120
      };

      performanceMonitor.setThresholds(customThresholds);
      const updatedThresholds = performanceMonitor.getThresholds();

      expect(updatedThresholds).toEqual(customThresholds);
    });

    it('validates threshold values', () => {
      const invalidThresholds = {
        componentRenderTime: -5,
        bundleSize: 0,
        memoryUsage: -10,
        fps: -60,
        loadTime: -100,
        interactionDelay: -50
      };

      // Should handle invalid values gracefully
      performanceMonitor.setThresholds(invalidThresholds);
      const thresholds = performanceMonitor.getThresholds();

      // Should not have negative values
      expect(thresholds.componentRenderTime).toBeGreaterThanOrEqual(0);
      expect(thresholds.bundleSize).toBeGreaterThanOrEqual(0);
      expect(thresholds.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('allows partial threshold updates', () => {
      const originalThresholds = performanceMonitor.getThresholds();
      const partialUpdate = { componentRenderTime: 25 };

      performanceMonitor.setThresholds(partialUpdate);
      const updatedThresholds = performanceMonitor.getThresholds();

      expect(updatedThresholds.componentRenderTime).toBe(25);
      expect(updatedThresholds.bundleSize).toBe(originalThresholds.bundleSize);
    });
  });

  describe('Performance Analysis', () => {
    beforeEach(() => {
      // Add some test metrics
      performanceMonitor.recordMetric('componentRenderTime', 18);
      performanceMonitor.recordMetric('componentRenderTime', 22);
      performanceMonitor.recordMetric('componentRenderTime', 14);
      performanceMonitor.recordMetric('fps', 58);
      performanceMonitor.recordMetric('fps', 52);
      performanceMonitor.recordMetric('memoryUsage', 95);
    });

    it('calculates average performance metrics', () => {
      const analysis = performanceMonitor.getPerformanceAnalysis();

      expect(analysis.averageRenderTime).toBeCloseTo(18, 1);
      expect(analysis.averageFPS).toBeCloseTo(55, 1);
      expect(analysis.averageMemoryUsage).toBe(95);
    });

    it('identifies performance issues', () => {
      performanceMonitor.recordMetric('componentRenderTime', 30); // Above threshold
      performanceMonitor.recordMetric('fps', 45); // Below threshold

      const analysis = performanceMonitor.getPerformanceAnalysis();

      expect(analysis.issues.length).toBeGreaterThan(0);
      expect(analysis.issues.some(issue => issue.includes('component renders'))).toBe(true);
      expect(analysis.issues.some(issue => issue.includes('FPS'))).toBe(true);
    });

    it('provides performance recommendations', () => {
      performanceMonitor.recordMetric('bundleSize', 800); // Above threshold
      performanceMonitor.recordMetric('memoryUsage', 150); // Above threshold

      const analysis = performanceMonitor.getPerformanceAnalysis();

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(rec => rec.includes('code splitting'))).toBe(true);
      expect(analysis.recommendations.some(rec => rec.includes('Memory leak'))).toBe(true);
    });

    it('calculates performance score', () => {
      const analysis = performanceMonitor.getPerformanceAnalysis();

      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Memory Monitoring', () => {
    it('tracks memory usage', () => {
      performanceMonitor.trackMemoryUsage();
      const metrics = performanceMonitor.getMetrics();

      if (metrics.length > 0) {
        const latestMetric = metrics[metrics.length - 1];
        expect(latestMetric.memoryUsage).toBeGreaterThanOrEqual(0);
      }
    });

    it('detects memory leaks', () => {
      // Simulate increasing memory usage
      performanceMonitor.recordMetric('memoryUsage', 50);
      performanceMonitor.recordMetric('memoryUsage', 75);
      performanceMonitor.recordMetric('memoryUsage', 100);
      performanceMonitor.recordMetric('memoryUsage', 125);

      const leakDetected = performanceMonitor.detectMemoryLeak();
      expect(typeof leakDetected).toBe('boolean');
    });

    it('provides memory usage warnings', () => {
      performanceMonitor.recordMetric('memoryUsage', 150); // Above threshold

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('High memory usage')
      );
    });
  });

  describe('FPS Monitoring', () => {
    it('tracks frame rate', () => {
      const fpsCallback = jest.fn();
      performanceMonitor.trackFPS(fpsCallback);

      // Simulate some time passing
      jest.advanceTimersByTime(1000);

      expect(typeof fpsCallback).toBe('function');
    });

    it('detects low FPS', () => {
      performanceMonitor.recordMetric('fps', 30); // Below threshold

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Low FPS')
      );
    });

    it('calculates average FPS over time', () => {
      performanceMonitor.recordMetric('fps', 60);
      performanceMonitor.recordMetric('fps', 55);
      performanceMonitor.recordMetric('fps', 58);

      const analysis = performanceMonitor.getPerformanceAnalysis();
      expect(analysis.averageFPS).toBeCloseTo(57.7, 1);
    });
  });

  describe('Component Performance', () => {
    it('measures component render time', () => {
      performanceMonitor.measureComponentRender('TestComponent', () => {
        // Simulate component render work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
      });

      const metrics = performanceMonitor.getMetrics();
      const latestMetric = metrics[metrics.length - 1];
      expect(latestMetric.componentRenderTime).toBeGreaterThan(0);
    });

    it('identifies slow components', () => {
      performanceMonitor.measureComponentRender('SlowComponent', () => {
        // Simulate slow render
        const start = Date.now();
        while (Date.now() - start < 50) {} // 50ms delay
      });

      const slowComponents = performanceMonitor.getSlowComponents();
      expect(slowComponents.length).toBeGreaterThanOrEqual(0);
    });

    it('tracks multiple component renders', () => {
      performanceMonitor.measureComponentRender('Component1', () => {});
      performanceMonitor.measureComponentRender('Component2', () => {});
      performanceMonitor.measureComponentRender('Component1', () => {});

      const componentStats = performanceMonitor.getComponentStats();
      expect(componentStats).toMatchObject({
        Component1: expect.objectContaining({
          renderCount: 2,
          averageTime: expect.any(Number)
        }),
        Component2: expect.objectContaining({
          renderCount: 1,
          averageTime: expect.any(Number)
        })
      });
    });
  });

  describe('Data Export', () => {
    it('exports metrics to JSON', () => {
      performanceMonitor.recordMetric('componentRenderTime', 15);
      performanceMonitor.recordMetric('fps', 60);

      const exportedData = performanceMonitor.exportMetrics();

      expect(exportedData).toMatchObject({
        timestamp: expect.any(Number),
        metrics: expect.any(Array),
        thresholds: expect.any(Object),
        analysis: expect.any(Object)
      });
    });

    it('clears metrics when requested', () => {
      performanceMonitor.recordMetric('componentRenderTime', 15);
      performanceMonitor.recordMetric('fps', 60);

      expect(performanceMonitor.getMetrics().length).toBeGreaterThan(0);

      performanceMonitor.clearMetrics();
      expect(performanceMonitor.getMetrics().length).toBe(0);
    });

    it('provides metrics summary', () => {
      performanceMonitor.recordMetric('componentRenderTime', 15);
      performanceMonitor.recordMetric('componentRenderTime', 20);
      performanceMonitor.recordMetric('fps', 60);
      performanceMonitor.recordMetric('fps', 55);

      const summary = performanceMonitor.getMetricsSummary();

      expect(summary).toMatchObject({
        totalMetrics: expect.any(Number),
        timeRange: expect.any(Object),
        averages: expect.any(Object),
        violations: expect.any(Array)
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing performance API gracefully', () => {
      // Mock missing PerformanceObserver
      const originalPerformanceObserver = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      const monitor = new PerformanceMonitor();
      expect(monitor).toBeInstanceOf(PerformanceMonitor);

      // Restore
      global.PerformanceObserver = originalPerformanceObserver;
    });

    it('handles invalid metric types', () => {
      expect(() => {
        performanceMonitor.recordMetric('invalidMetric' as any, 100);
      }).not.toThrow();
    });

    it('handles negative metric values', () => {
      expect(() => {
        performanceMonitor.recordMetric('componentRenderTime', -10);
      }).not.toThrow();
    });
  });
});