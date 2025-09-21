// =============================================================================
// PERFORMANCE MONITORING SYSTEM FOR DIAMOND APP
// =============================================================================

interface PerformanceMetrics {
  componentRenderTime: number;
  bundleSize: number;
  memoryUsage: number;
  fps: number;
  loadTime: number;
  interactionDelay: number;
}

interface PerformanceThresholds {
  componentRenderTime: number; // ms
  bundleSize: number; // KB
  memoryUsage: number; // MB
  fps: number;
  loadTime: number; // ms
  interactionDelay: number; // ms
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private componentStats: Record<string, { renderCount: number; totalTime: number; averageTime: number }> = {};
  private thresholds: PerformanceThresholds = {
    componentRenderTime: 16, // 60fps target
    bundleSize: 500, // 500KB target
    memoryUsage: 100, // 100MB target
    fps: 55, // 55fps minimum
    loadTime: 200, // 200ms target
    interactionDelay: 100 // 100ms target
  };

  private observers: PerformanceObserver[] = [];
  private _isMonitoring = false;

  constructor() {
    this.initializeObservers();
  }

  // Initialize performance observers
  private initializeObservers() {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.duration > this.thresholds.componentRenderTime) {
              console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
              this.recordMetric('componentRenderTime', entry.duration);
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }

      // Monitor paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.name === 'first-paint') {
              this.recordMetric('loadTime', entry.startTime);
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint observer not supported');
      }
    }
  }

  // Start monitoring
  startMonitoring() {
    if (this._isMonitoring) return;
    
    this._isMonitoring = true;
    this.monitorFPS();
    this.monitorMemory();
    this.monitorBundleSize();
    
    // Performance monitoring started
  }

  // Stop monitoring
  stopMonitoring() {
    this._isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    // Performance monitoring stopped
  }

  // Monitor FPS
  private monitorFPS() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      if (!this._isMonitoring) return;
      
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.recordMetric('fps', fps);
        
        if (fps < this.thresholds.fps) {
          console.warn(`⚠️ Low FPS detected: ${fps}`);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(measureFPS);
      }
    };
    
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(measureFPS);
    }
  }

  // Monitor memory usage
  private monitorMemory() {
    if ('memory' in performance) {
      const checkMemory = () => {
        if (!this._isMonitoring) return;
        
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        
        this.recordMetric('memoryUsage', usedMB);
        
        if (usedMB > this.thresholds.memoryUsage) {
          console.warn(`⚠️ High memory usage: ${usedMB.toFixed(2)}MB`);
        }
        
        setTimeout(checkMemory, 5000); // Check every 5 seconds
      };
      
      checkMemory();
    }
  }

  // Monitor bundle size
  private monitorBundleSize() {
    // Estimate bundle size from performance timing
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries && navigationEntries.length > 0) {
      const navigationEntry = navigationEntries[0] as any;
      const transferSize = navigationEntry.transferSize || 0;
      const bundleSizeKB = transferSize / 1024;
      
      this.recordMetric('bundleSize', bundleSizeKB);
      
      if (bundleSizeKB > this.thresholds.bundleSize) {
        console.warn(`⚠️ Large bundle size: ${bundleSizeKB.toFixed(2)}KB`);
      }
    }
  }

  // Record a performance metric
  recordMetric(type: keyof PerformanceMetrics, value: number) {
    const metric: Partial<PerformanceMetrics> = {
      [type]: value
    };
    
    this.metrics.push(metric as PerformanceMetrics);
    
    // Check for threshold violations and warn
    if (type === 'fps' && value < this.thresholds.fps) {
      console.warn(`⚠️ Low FPS detected: ${value}`);
    } else if (type === 'memoryUsage' && value > this.thresholds.memoryUsage) {
      console.warn(`⚠️ High memory usage: ${value.toFixed(2)}MB`);
    } else if (type === 'componentRenderTime' && value > this.thresholds.componentRenderTime) {
      console.warn(`⚠️ Slow component render: ${value.toFixed(2)}ms`);
    } else if (type === 'loadTime' && value > this.thresholds.loadTime) {
      console.warn(`⚠️ Slow load time: ${value.toFixed(2)}ms`);
    } else if (type === 'interactionDelay' && value > this.thresholds.interactionDelay) {
      console.warn(`⚠️ Slow interaction response: ${value.toFixed(2)}ms`);
    } else if (type === 'bundleSize' && value > this.thresholds.bundleSize) {
      console.warn(`⚠️ Large bundle size: ${value.toFixed(2)}KB`);
    }
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  // Get performance report
  getPerformanceReport(): {
    current: PerformanceMetrics;
    average: PerformanceMetrics;
    recommendations: string[];
  } {
    const current = this.metrics[this.metrics.length - 1] || this.getDefaultMetrics();
    const average = this.calculateAverages();
    const recommendations = this.generateRecommendations(current, average);
    
    return { current, average, recommendations };
  }

  // Calculate average metrics
  private calculateAverages(): PerformanceMetrics {
    const sums = {
      componentRenderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
      fps: 0,
      loadTime: 0,
      interactionDelay: 0
    };
    
    const counts = {
      componentRenderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
      fps: 0,
      loadTime: 0,
      interactionDelay: 0
    };
    
    this.metrics.forEach(metric => {
      if (metric.componentRenderTime !== undefined) {
        sums.componentRenderTime += metric.componentRenderTime;
        counts.componentRenderTime++;
      }
      if (metric.bundleSize !== undefined) {
        sums.bundleSize += metric.bundleSize;
        counts.bundleSize++;
      }
      if (metric.memoryUsage !== undefined) {
        sums.memoryUsage += metric.memoryUsage;
        counts.memoryUsage++;
      }
      if (metric.fps !== undefined) {
        sums.fps += metric.fps;
        counts.fps++;
      }
      if (metric.loadTime !== undefined) {
        sums.loadTime += metric.loadTime;
        counts.loadTime++;
      }
      if (metric.interactionDelay !== undefined) {
        sums.interactionDelay += metric.interactionDelay;
        counts.interactionDelay++;
      }
    });
    
    return {
      componentRenderTime: counts.componentRenderTime > 0 ? sums.componentRenderTime / counts.componentRenderTime : 0,
      bundleSize: counts.bundleSize > 0 ? sums.bundleSize / counts.bundleSize : 0,
      memoryUsage: counts.memoryUsage > 0 ? sums.memoryUsage / counts.memoryUsage : 0,
      fps: counts.fps > 0 ? sums.fps / counts.fps : 0,
      loadTime: counts.loadTime > 0 ? sums.loadTime / counts.loadTime : 0,
      interactionDelay: counts.interactionDelay > 0 ? sums.interactionDelay / counts.interactionDelay : 0
    };
  }

  // Generate performance recommendations
  private generateRecommendations(current: PerformanceMetrics, average: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (current.fps < this.thresholds.fps) {
      recommendations.push('🎯 Optimize rendering: Use React.memo and useMemo for expensive components');
    }
    
    if (current.bundleSize > this.thresholds.bundleSize) {
      recommendations.push('📦 Implement code splitting: Use lazy loading for heavy components');
    }
    
    if (current.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('🧠 Memory leak detected: Check for unmounted component cleanup');
    }
    
    if (current.loadTime > this.thresholds.loadTime) {
      recommendations.push('⚡ Optimize initial load: Implement skeleton loading and progressive hydration');
    }
    
    if (current.interactionDelay > this.thresholds.interactionDelay) {
      recommendations.push('👆 Interaction lag: Debounce expensive operations and use web workers');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance is excellent! Keep up the good work!');
    }
    
    return recommendations;
  }

  // Get default metrics
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      componentRenderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
      fps: 60,
      loadTime: 0,
      interactionDelay: 0
    };
  }

  // Measure component render time
  measureComponentRender(componentName: string, renderFunction: () => void) {
    const startTime = performance.now();
    renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    this.recordMetric('componentRenderTime', renderTime);
    
    // Track component-specific stats
    if (!this.componentStats[componentName]) {
      this.componentStats[componentName] = { renderCount: 0, totalTime: 0, averageTime: 0 };
    }
    this.componentStats[componentName].renderCount++;
    this.componentStats[componentName].totalTime += renderTime;
    this.componentStats[componentName].averageTime = this.componentStats[componentName].totalTime / this.componentStats[componentName].renderCount;
    
    if (renderTime > this.thresholds.componentRenderTime) {
      console.warn(`⚠️ Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
    
    return renderTime;
  }

  // Measure interaction delay
  measureInteractionDelay(interactionName: string, interactionFunction: () => void) {
    const startTime = performance.now();
    interactionFunction();
    const endTime = performance.now();
    const delay = endTime - startTime;
    
    this.recordMetric('interactionDelay', delay);
    
    if (delay > this.thresholds.interactionDelay) {
      console.warn(`⚠️ Slow interaction: ${interactionName} took ${delay.toFixed(2)}ms`);
    }
    
    return delay;
  }

  // Export performance data
  exportPerformanceData(): string {
    const report = this.getPerformanceReport();
    return JSON.stringify(report, null, 2);
  }

  // Set custom thresholds
  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    // Validate threshold values
    const validatedThresholds: Partial<PerformanceThresholds> = {};
    
    Object.entries(thresholds).forEach(([key, value]) => {
      if (typeof value === 'number' && value >= 0) {
        validatedThresholds[key as keyof PerformanceThresholds] = value;
      }
    });
    
    this.thresholds = { ...this.thresholds, ...validatedThresholds };
  }

  // Get current thresholds
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  // Check if monitoring is active
  isMonitoring(): boolean {
    return this._isMonitoring;
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.componentStats = {};
  }

  // Get component statistics
  getComponentStats(): Record<string, { renderCount: number; totalTime: number; averageTime: number }> {
    return { ...this.componentStats };
  }

  // Export metrics as JSON
  exportMetrics(): any {
    const averages = this.calculateAverages();
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      thresholds: this.thresholds,
      isMonitoring: this._isMonitoring,
      analysis: {
        averages,
        recommendations: this.generateRecommendations(averages, averages)
      }
    };
  }

  // Get metrics summary
  getMetricsSummary(): any {
    const averages = this.calculateAverages();
    const violations: string[] = [];
    
    // Check for threshold violations
    if (averages.fps < this.thresholds.fps) violations.push('Low FPS detected');
    if (averages.bundleSize > this.thresholds.bundleSize) violations.push('Large bundle size');
    if (averages.memoryUsage > this.thresholds.memoryUsage) violations.push('High memory usage');
    if (averages.loadTime > this.thresholds.loadTime) violations.push('Slow load time');
    if (averages.interactionDelay > this.thresholds.interactionDelay) violations.push('Slow interaction response');
    if (averages.componentRenderTime > this.thresholds.componentRenderTime) violations.push('Slow component renders');
    
    return {
      totalMetrics: this.metrics.length,
      timeRange: {
        start: this.metrics.length > 0 ? this.metrics[0] : null,
        end: this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
      },
      averages,
      violations,
      thresholds: this.thresholds,
      isMonitoring: this._isMonitoring,
      recommendations: this.generateRecommendations(averages, averages)
    };
  }

  // Get performance analysis
  getPerformanceAnalysis(): any {
    const averages = this.calculateAverages();
    const issues: string[] = [];
    
    // Check for performance issues
    if (averages.fps < this.thresholds.fps) issues.push('Low FPS detected');
    if (averages.componentRenderTime > this.thresholds.componentRenderTime) issues.push('Slow component renders');
    if (averages.memoryUsage > this.thresholds.memoryUsage) issues.push('High memory usage');
    if (averages.loadTime > this.thresholds.loadTime) issues.push('Slow load time');
    if (averages.interactionDelay > this.thresholds.interactionDelay) issues.push('Slow interaction response');
    if (averages.bundleSize > this.thresholds.bundleSize) issues.push('Large bundle size');
    
    // Calculate performance score (0-100)
    let score = 100;
    if (averages.fps < this.thresholds.fps) score -= 20;
    if (averages.componentRenderTime > this.thresholds.componentRenderTime) score -= 15;
    if (averages.memoryUsage > this.thresholds.memoryUsage) score -= 15;
    if (averages.loadTime > this.thresholds.loadTime) score -= 15;
    if (averages.interactionDelay > this.thresholds.interactionDelay) score -= 15;
    if (averages.bundleSize > this.thresholds.bundleSize) score -= 20;
    
    return {
      averageFPS: averages.fps,
      averageRenderTime: averages.componentRenderTime,
      averageMemoryUsage: averages.memoryUsage,
      averageLoadTime: averages.loadTime,
      averageInteractionDelay: averages.interactionDelay,
      averageBundleSize: averages.bundleSize,
      totalMetrics: this.metrics.length,
      issues,
      score: Math.max(0, score),
      recommendations: this.generateRecommendations(averages, averages)
    };
  }

  // Get slow components
  getSlowComponents(): string[] {
    const slowComponents: string[] = [];
    Object.entries(this.componentStats).forEach(([componentName, stats]) => {
      if (stats.averageTime > this.thresholds.componentRenderTime) {
        slowComponents.push(componentName);
      }
    });
    return slowComponents;
  }

  // Track memory usage
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      this.recordMetric('memoryUsage', usedMB);
    }
  }

  // Detect memory leak
  detectMemoryLeak(): boolean {
    const memoryMetrics = this.metrics.filter(m => m.memoryUsage > 0);
    if (memoryMetrics.length < 3) return false;
    
    // Check if memory usage is consistently increasing
    const recent = memoryMetrics.slice(-3);
    return recent[0].memoryUsage < recent[1].memoryUsage && 
           recent[1].memoryUsage < recent[2].memoryUsage;
  }

  // Track FPS
  trackFPS(callback?: (fps: number) => void): void {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.recordMetric('fps', fps);
        
        if (callback) {
          callback(fps);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(measureFPS);
      }
    };
    
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(measureFPS);
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring hooks
export const usePerformanceMonitoring = () => {
  const startMonitoring = () => performanceMonitor.startMonitoring();
  const stopMonitoring = () => performanceMonitor.stopMonitoring();
  const getReport = () => performanceMonitor.getPerformanceReport();
  const measureRender = (name: string, fn: () => void) => performanceMonitor.measureComponentRender(name, fn);
  const measureInteraction = (name: string, fn: () => void) => performanceMonitor.measureInteractionDelay(name, fn);
  
  return {
    startMonitoring,
    stopMonitoring,
    getReport,
    measureRender,
    measureInteraction
  };
};

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
}

export default PerformanceMonitor;
