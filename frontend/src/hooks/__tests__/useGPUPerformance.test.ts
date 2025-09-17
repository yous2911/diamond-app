import { renderHook, act } from '@testing-library/react';
import { useGPUPerformance } from '../useGPUPerformance';

// Mock performance APIs
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  getEntriesByType: jest.fn(() => []),
  mark: jest.fn(),
  measure: jest.fn()
};

Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    hardwareConcurrency: 8,
    deviceMemory: 8
  }
});

// Mock WebGL context
const mockWebGLContext = {
  getParameter: jest.fn(),
  getExtension: jest.fn(),
  getSupportedExtensions: jest.fn(() => ['WEBGL_debug_renderer_info'])
};

Object.defineProperty(global, 'HTMLCanvasElement', {
  writable: true,
  value: class MockCanvas {
    getContext() {
      return mockWebGLContext;
    }
  }
});

describe('useGPUPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebGLContext.getParameter.mockReturnValue('Mock GPU Renderer');
    mockWebGLContext.getExtension.mockReturnValue({
      UNMASKED_VENDOR_WEBGL: 'Mock Vendor',
      UNMASKED_RENDERER_WEBGL: 'Mock Renderer'
    });
  });

  describe('Hook Initialization', () => {
    it('initializes with default performance tier', () => {
      const { result } = renderHook(() => useGPUPerformance());

      expect(result.current.performanceTier).toBeDefined();
      expect(['low', 'medium', 'high', 'ultra']).toContain(result.current.performanceTier);
    });

    it('provides performance config based on tier', () => {
      const { result } = renderHook(() => useGPUPerformance());

      expect(result.current.canUseAdvancedEffects).toBeDefined();
      expect(result.current.gpuInfo).toBeDefined();
      expect(typeof result.current.canUseAdvancedEffects).toBe('boolean');
    });

    it('provides helper functions', () => {
      const { result } = renderHook(() => useGPUPerformance());

      expect(typeof result.current.getOptimalDuration).toBe('function');
      expect(typeof result.current.shouldUseComplexAnimation).toBe('function');
      expect(typeof result.current.getOptimalParticleCount).toBe('function');
    });
  });

  describe('Helper Functions', () => {
    it('getOptimalDuration works correctly', () => {
      const { result } = renderHook(() => useGPUPerformance());

      const duration = result.current.getOptimalDuration(400);
      expect(duration).toEqual(expect.any(Number));
      expect(duration).toBeGreaterThan(0);
    });

    it('shouldUseComplexAnimation returns boolean', () => {
      const { result } = renderHook(() => useGPUPerformance());

      const shouldUse = result.current.shouldUseComplexAnimation();
      expect(typeof shouldUse).toBe('boolean');
    });

    it('getOptimalParticleCount works correctly', () => {
      const { result } = renderHook(() => useGPUPerformance());

      const count = result.current.getOptimalParticleCount(20);
      expect(count).toEqual(expect.any(Number));
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Browser Compatibility', () => {
    it('hook initializes without errors when WebGL is not available', () => {
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

      const { result } = renderHook(() => useGPUPerformance());

      expect(result.current.performanceTier).toBeDefined();
      expect(result.current.gpuInfo).toBeDefined();
    });
  });
});