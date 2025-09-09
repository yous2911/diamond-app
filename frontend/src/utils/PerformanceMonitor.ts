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
  private thresholds: PerformanceThresholds = {
    componentRenderTime: 16, // 60fps target
    bundleSize: 500, // 500KB target
    memoryUsage: 100, // 100MB target
    fps: 55, // 55fps minimum
    loadTime: 200, // 200ms target
    interactionDelay: 100 // 100ms target
  };

  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

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
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFPS();
    this.monitorMemory();
    this.monitorBundleSize();
    
    // Performance monitoring started
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    // Performance monitoring stopped
  }

  // Monitor FPS
  private monitorFPS() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      if (!this.isMonitoring) return;
      
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
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // Monitor memory usage
  private monitorMemory() {
    if ('memory' in performance) {
      const checkMemory = () => {
        if (!this.isMonitoring) return;
        
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
    const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
    if (navigationEntry) {
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
    
    this.metrics.forEach(metric => {
      sums.componentRenderTime += metric.componentRenderTime || 0;
      sums.bundleSize += metric.bundleSize || 0;
      sums.memoryUsage += metric.memoryUsage || 0;
      sums.fps += metric.fps || 0;
      sums.loadTime += metric.loadTime || 0;
      sums.interactionDelay += metric.interactionDelay || 0;
    });
    
    const count = this.metrics.length || 1;
    
    return {
      componentRenderTime: sums.componentRenderTime / count,
      bundleSize: sums.bundleSize / count,
      memoryUsage: sums.memoryUsage / count,
      fps: sums.fps / count,
      loadTime: sums.loadTime / count,
      interactionDelay: sums.interactionDelay / count
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
    this.thresholds = { ...this.thresholds, ...thresholds };
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
