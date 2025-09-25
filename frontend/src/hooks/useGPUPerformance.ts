import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// 🚀 GPU PERFORMANCE DETECTION & ADAPTIVE ANIMATIONS
// =============================================================================

export type PerformanceTier = 'low' | 'medium' | 'high' | 'ultra';

interface PerformanceConfig {
  particleCount: number;
  animationDuration: number;
  complexAnimations: boolean;
  blurEffects: boolean;
  shadowEffects: boolean;
  particlePhysics: boolean;
  frameRate: number;
  reducedMotion: boolean;
}

const PERFORMANCE_CONFIGS: Record<PerformanceTier, PerformanceConfig> = {
  low: {
    particleCount: 5,
    animationDuration: 800,
    complexAnimations: false,
    blurEffects: false,
    shadowEffects: false,
    particlePhysics: false,
    frameRate: 30,
    reducedMotion: true
  },
  medium: {
    particleCount: 15,
    animationDuration: 600,
    complexAnimations: true,
    blurEffects: false,
    shadowEffects: true,
    particlePhysics: false,
    frameRate: 60,
    reducedMotion: false
  },
  high: {
    particleCount: 35,
    animationDuration: 400,
    complexAnimations: true,
    blurEffects: true,
    shadowEffects: true,
    particlePhysics: true,
    frameRate: 60,
    reducedMotion: false
  },
  ultra: {
    particleCount: 60,
    animationDuration: 300,
    complexAnimations: true,
    blurEffects: true,
    shadowEffects: true,
    particlePhysics: true,
    frameRate: 120,
    reducedMotion: false
  }
};

export const useGPUPerformance = () => {
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>('medium');
  const [config, setConfig] = useState<PerformanceConfig>(PERFORMANCE_CONFIGS.medium);
  const [isDetecting, setIsDetecting] = useState(true);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // GPU Capability Detection
  const detectGPUCapability = useCallback(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      return 'low';
    }

    // Check for advanced GPU features
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // High-end GPU detection
    const highEndGPUs = [
      'RTX 4090', 'RTX 4080', 'RTX 4070', 'RTX 3090', 'RTX 3080', 'RTX 3070',
      'RX 7900', 'RX 6900', 'RX 6800', 'Apple M2', 'Apple M1'
    ];
    
    const mediumGPUs = [
      'RTX 3060', 'RTX 2080', 'RTX 2070', 'GTX 1080', 'GTX 1070',
      'RX 6600', 'RX 5700', 'Intel Iris'
    ];

    const rendererLower = renderer.toLowerCase();
    
    if (highEndGPUs.some(gpu => rendererLower.includes(gpu.toLowerCase()))) {
      return 'ultra';
    }
    
    if (mediumGPUs.some(gpu => rendererLower.includes(gpu.toLowerCase()))) {
      return 'high';
    }

    // Check WebGL capabilities
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    
    if (maxTextureSize >= 16384 && maxViewportDims[0] >= 16384) {
      return 'high';
    } else if (maxTextureSize >= 8192) {
      return 'medium';
    }
    
    return 'low';
  }, []);

  // Real-time Frame Rate Monitoring
  const measureFrameRate = useCallback(() => {
    const measure = (timestamp: number) => {
      if (lastFrameTimeRef.current) {
        const frameTime = timestamp - lastFrameTimeRef.current;
        frameTimesRef.current.push(frameTime);
        
        // Keep only last 60 frames
        if (frameTimesRef.current.length > 60) {
          frameTimesRef.current.shift();
        }
      }
      
      lastFrameTimeRef.current = timestamp;
      
      if (frameTimesRef.current.length >= 30) {
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const fps = 1000 / avgFrameTime;
        
        // Adjust performance tier based on actual FPS
        let newTier: PerformanceTier;
        if (fps >= 55) {
          newTier = 'ultra';
        } else if (fps >= 45) {
          newTier = 'high';
        } else if (fps >= 30) {
          newTier = 'medium';
        } else {
          newTier = 'low';
        }
        
        // Only update if tier changed significantly
        if (newTier !== performanceTier) {
          setPerformanceTier(newTier);
          setConfig(PERFORMANCE_CONFIGS[newTier]);
        }
        
        setIsDetecting(false);
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(measure);
    };
    
    animationFrameRef.current = requestAnimationFrame(measure);
  }, []); // Remove performanceTier from dependencies to prevent infinite loop

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // System Capability Detection
  const detectSystemCapabilities = useCallback(() => {
    const capabilities = {
      cores: navigator.hardwareConcurrency || 4,
      memory: (navigator as any).deviceMemory || 4,
      connection: (navigator as any).connection?.effectiveType || '4g',
      pixelRatio: window.devicePixelRatio || 1,
      screenSize: window.screen.width * window.screen.height
    };
    
    // Adjust based on system specs
    let baseScore = 0;
    
    // CPU cores scoring
    if (capabilities.cores >= 8) baseScore += 3;
    else if (capabilities.cores >= 4) baseScore += 2;
    else baseScore += 1;
    
    // RAM scoring
    if (capabilities.memory >= 8) baseScore += 3;
    else if (capabilities.memory >= 4) baseScore += 2;
    else baseScore += 1;
    
    // Connection scoring
    if (capabilities.connection === '4g' || capabilities.connection === '5g') baseScore += 2;
    else baseScore += 1;
    
    // High DPI penalty (more pixels to push)
    if (capabilities.pixelRatio > 2) baseScore -= 1;
    
    // Large screen bonus
    if (capabilities.screenSize > 2073600) baseScore += 1; // > 1920x1080
    
    return baseScore;
  }, []);

  // Check for reduced motion preference
  const checkReducedMotionPreference = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Initialize performance detection
  useEffect(() => {
    const gpuTier = detectGPUCapability();
    const systemScore = detectSystemCapabilities();
    const reducedMotion = checkReducedMotionPreference();
    
    // Combine GPU and system scoring
    let finalTier: PerformanceTier;
    
    if (reducedMotion) {
      finalTier = 'low';
    } else if (gpuTier === 'ultra' && systemScore >= 8) {
      finalTier = 'ultra';
    } else if (gpuTier === 'high' || systemScore >= 6) {
      finalTier = 'high';
    } else if (systemScore >= 4) {
      finalTier = 'medium';
    } else {
      finalTier = 'low';
    }
    
    setPerformanceTier(finalTier);
    setConfig(PERFORMANCE_CONFIGS[finalTier]);
    
    // Start frame rate monitoring for dynamic adjustment
    measureFrameRate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detectGPUCapability, detectSystemCapabilities, checkReducedMotionPreference, measureFrameRate]);

  // Adaptive animation helpers
  const getOptimalDuration = useCallback((baseDuration: number) => {
    return Math.max(baseDuration * (config.animationDuration / 400), 100);
  }, [config.animationDuration]);

  const shouldUseComplexAnimation = useCallback(() => {
    return config.complexAnimations;
  }, [config.complexAnimations]);

  const getOptimalParticleCount = useCallback((baseCount: number) => {
    const ratio = config.particleCount / 35; // 35 is baseline
    const optimized = Math.max(Math.floor(baseCount * ratio), 1);
    
    // Performance tier adjustments
    if (performanceTier === 'low') return Math.min(optimized, 15);
    if (performanceTier === 'medium') return Math.min(optimized, 35);
    if (performanceTier === 'high') return Math.min(optimized, 75);
    return Math.min(optimized, 100); // Ultra tier
  }, [config.particleCount, performanceTier]);

  // Memory and performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    const performance = window.performance as any;
    return {
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      } : null,
      timing: performance.timing ? {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        windowLoad: performance.timing.loadEventEnd - performance.timing.navigationStart
      } : null,
      fps: frameTimesRef.current.length > 0 ? 
        Math.round(1000 / (frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length)) : 0
    };
  }, []);

  return {
    performanceTier,
    config,
    isDetecting,
    getOptimalDuration,
    shouldUseComplexAnimation,
    getOptimalParticleCount,
    getPerformanceMetrics,
    
    // Convenience methods
    canUseBlur: config.blurEffects,
    canUseShadows: config.shadowEffects,
    canUsePhysics: config.particlePhysics,
    maxFrameRate: config.frameRate,
    reducedMotion: config.reducedMotion
  };
};

export default useGPUPerformance;