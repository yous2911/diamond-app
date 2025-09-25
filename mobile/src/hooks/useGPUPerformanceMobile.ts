import { useState, useEffect, useCallback } from 'react';
import { Platform, Dimensions } from 'react-native';

interface GPUPerformanceData {
  performanceTier: 'low' | 'medium' | 'high' | 'ultra';
  deviceType: 'phone' | 'tablet';
  screenSize: 'small' | 'medium' | 'large';
  memoryClass: 'low' | 'medium' | 'high';
  recommendedSettings: {
    particleCount: number;
    animationQuality: 'low' | 'medium' | 'high';
    enablePhysics: boolean;
    enableTrails: boolean;
    enableShadows: boolean;
    enableGlow: boolean;
  };
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  isStable: boolean;
}

export const useGPUPerformanceMobile = () => {
  const [performanceData, setPerformanceData] = useState<GPUPerformanceData | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    isStable: true,
  });
  const [isDetecting, setIsDetecting] = useState(true);

  const { width, height } = Dimensions.get('window');
  const screenSize = Math.sqrt(width * width + height * height);

  // Detect device performance tier
  const detectPerformanceTier = useCallback((): GPUPerformanceData['performanceTier'] => {
    // Screen size factor
    const sizeFactor = screenSize / 1000; // Normalize to reasonable range

    // Platform factor (iOS generally performs better)
    const platformFactor = Platform.OS === 'ios' ? 1.2 : 1.0;

    // Memory estimation based on screen size and platform
    const estimatedMemory = (screenSize * platformFactor) / 100;

    // Performance score calculation
    const performanceScore = (sizeFactor * platformFactor) + (estimatedMemory * 0.1);

    if (performanceScore >= 3.0) return 'ultra';
    if (performanceScore >= 2.0) return 'high';
    if (performanceScore >= 1.0) return 'medium';
    return 'low';
  }, [screenSize]);

  // Detect device type
  const detectDeviceType = useCallback((): GPUPerformanceData['deviceType'] => {
    return screenSize > 1000 ? 'tablet' : 'phone';
  }, [screenSize]);

  // Detect screen size category
  const detectScreenSize = useCallback((): GPUPerformanceData['screenSize'] => {
    if (screenSize < 800) return 'small';
    if (screenSize < 1200) return 'medium';
    return 'large';
  }, [screenSize]);

  // Estimate memory class
  const detectMemoryClass = useCallback((): GPUPerformanceData['memoryClass'] => {
    const deviceType = detectDeviceType();
    const performanceTier = detectPerformanceTier();

    if (deviceType === 'tablet' && performanceTier === 'ultra') return 'high';
    if (deviceType === 'tablet' && performanceTier === 'high') return 'high';
    if (performanceTier === 'ultra') return 'high';
    if (performanceTier === 'high') return 'medium';
    return 'low';
  }, [detectDeviceType, detectPerformanceTier]);

  // Get recommended settings based on performance
  const getRecommendedSettings = useCallback((tier: GPUPerformanceData['performanceTier']) => {
    const settings = {
      low: {
        particleCount: 20,
        animationQuality: 'low' as const,
        enablePhysics: false,
        enableTrails: false,
        enableShadows: false,
        enableGlow: false,
      },
      medium: {
        particleCount: 50,
        animationQuality: 'medium' as const,
        enablePhysics: true,
        enableTrails: false,
        enableShadows: false,
        enableGlow: true,
      },
      high: {
        particleCount: 100,
        animationQuality: 'high' as const,
        enablePhysics: true,
        enableTrails: true,
        enableShadows: true,
        enableGlow: true,
      },
      ultra: {
        particleCount: 200,
        animationQuality: 'high' as const,
        enablePhysics: true,
        enableTrails: true,
        enableShadows: true,
        enableGlow: true,
      },
    };

    return settings[tier];
  }, []);

  // Initialize performance detection
  useEffect(() => {
    const initializePerformance = async () => {
      setIsDetecting(true);

      // Simulate detection delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1000));

      const performanceTier = detectPerformanceTier();
      const deviceType = detectDeviceType();
      const screenSizeCategory = detectScreenSize();
      const memoryClass = detectMemoryClass();
      const recommendedSettings = getRecommendedSettings(performanceTier);

      setPerformanceData({
        performanceTier,
        deviceType,
        screenSize: screenSizeCategory,
        memoryClass,
        recommendedSettings,
      });

      setIsDetecting(false);
    };

    initializePerformance();
  }, [detectPerformanceTier, detectDeviceType, detectScreenSize, detectMemoryClass, getRecommendedSettings]);

  // Performance monitoring
  useEffect(() => {
    if (!performanceData) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let fpsHistory: number[] = [];

    const monitorPerformance = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      frameCount++;
      const currentFps = 1000 / deltaTime;

      // Update FPS history (keep last 60 frames)
      fpsHistory.push(currentFps);
      if (fpsHistory.length > 60) {
        fpsHistory.shift();
      }

      // Calculate average FPS
      const averageFps = fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length;

      // Determine stability
      const fpsVariance = fpsHistory.reduce((sum, fps) => sum + Math.pow(fps - averageFps, 2), 0) / fpsHistory.length;
      const isStable = fpsVariance < 100; // Low variance = stable

      setMetrics({
        fps: Math.round(averageFps),
        frameTime: Math.round(deltaTime * 100) / 100,
        memoryUsage: 0, // Not available in React Native
        isStable,
      });

      // Adjust settings if performance is poor
      if (averageFps < 30 && performanceData.performanceTier !== 'low') {
        console.warn('⚠️ Poor performance detected, consider reducing effects');
      }
    };

    const interval = setInterval(monitorPerformance, 1000);
    return () => clearInterval(interval);
  }, [performanceData]);

  // Helper functions
  const shouldUseComplexAnimation = useCallback(() => {
    return performanceData?.performanceTier === 'high' || performanceData?.performanceTier === 'ultra';
  }, [performanceData]);

  const shouldUseParticles = useCallback(() => {
    return performanceData?.recommendedSettings.particleCount > 0;
  }, [performanceData]);

  const getOptimalParticleCount = useCallback(() => {
    return performanceData?.recommendedSettings.particleCount || 20;
  }, [performanceData]);

  const getAnimationQuality = useCallback(() => {
    return performanceData?.recommendedSettings.animationQuality || 'medium';
  }, [performanceData]);

  return {
    performanceData,
    metrics,
    isDetecting,
    shouldUseComplexAnimation,
    shouldUseParticles,
    getOptimalParticleCount,
    getAnimationQuality,
    // Performance tier checks
    isLowEnd: performanceData?.performanceTier === 'low',
    isMediumEnd: performanceData?.performanceTier === 'medium',
    isHighEnd: performanceData?.performanceTier === 'high',
    isUltraEnd: performanceData?.performanceTier === 'ultra',
    // Device info
    isTablet: performanceData?.deviceType === 'tablet',
    isPhone: performanceData?.deviceType === 'phone',
    // Settings
    enablePhysics: performanceData?.recommendedSettings.enablePhysics || false,
    enableTrails: performanceData?.recommendedSettings.enableTrails || false,
    enableShadows: performanceData?.recommendedSettings.enableShadows || false,
    enableGlow: performanceData?.recommendedSettings.enableGlow || false,
  };
};


