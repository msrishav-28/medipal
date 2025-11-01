/**
 * Performance Monitoring Utilities
 * Provides tools for tracking and analyzing application performance metrics
 */

export interface PerformanceMetrics {
  navigationTiming: PerformanceTiming | null;
  resourceTimings: PerformanceResourceTiming[];
  customMarks: PerformanceMark[];
  customMeasures: PerformanceMeasure[];
  memoryInfo?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface VitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

/**
 * Mark a custom performance point
 */
export function markPerformance(name: string): void {
  if (typeof window !== 'undefined' && window.performance?.mark) {
    try {
      window.performance.mark(name);
    } catch (error) {
      console.warn(`Failed to mark performance: ${name}`, error);
    }
  }
}

/**
 * Measure time between two performance marks
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof window !== 'undefined' && window.performance?.measure) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measures = window.performance.getEntriesByName(name, 'measure');
      return measures.length > 0 ? measures[0]!.duration : null;
    } catch (error) {
      console.warn(`Failed to measure performance: ${name}`, error);
      return null;
    }
  }
  return null;
}

/**
 * Get all performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    navigationTiming: null,
    resourceTimings: [],
    customMarks: [],
    customMeasures: [],
  };

  if (typeof window === 'undefined' || !window.performance) {
    return metrics;
  }

  // Navigation timing
  if (window.performance.timing) {
    metrics.navigationTiming = window.performance.timing;
  }

  // Resource timings
  const resources = window.performance.getEntriesByType('resource');
  metrics.resourceTimings = resources as PerformanceResourceTiming[];

  // Custom marks
  const marks = window.performance.getEntriesByType('mark');
  metrics.customMarks = marks as PerformanceMark[];

  // Custom measures
  const measures = window.performance.getEntriesByType('measure');
  metrics.customMeasures = measures as PerformanceMeasure[];

  // Memory info (Chrome only)
  if ('memory' in window.performance) {
    const memory = (window.performance as any).memory;
    metrics.memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  return metrics;
}

/**
 * Get Web Vitals metrics
 */
export async function getWebVitals(): Promise<VitalsMetrics> {
  const vitals: VitalsMetrics = {};

  if (typeof window === 'undefined' || !window.performance) {
    return vitals;
  }

  // TTFB (Time to First Byte)
  const navigationTiming = window.performance.timing;
  if (navigationTiming) {
    vitals.TTFB = navigationTiming.responseStart - navigationTiming.requestStart;
  }

  // FCP (First Contentful Paint)
  const paintEntries = window.performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    vitals.FCP = fcpEntry.startTime;
  }

  // LCP (Largest Contentful Paint) - requires PerformanceObserver
  try {
    await new Promise<void>((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            vitals.LCP = lastEntry.startTime;
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Resolve after a short delay to capture the metric
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 3000);
      } else {
        resolve();
      }
    });
  } catch (error) {
    console.warn('Failed to observe LCP', error);
  }

  // CLS (Cumulative Layout Shift)
  try {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        vitals.CLS = clsValue;
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  } catch (error) {
    console.warn('Failed to observe CLS', error);
  }

  return vitals;
}

/**
 * Log performance metrics to console (development only)
 */
export function logPerformanceMetrics(): void {
  if (import.meta.env.DEV) {
    const metrics = getPerformanceMetrics();
    console.group('📊 Performance Metrics');
    
    if (metrics.navigationTiming) {
      const timing = metrics.navigationTiming;
      console.log('Page Load Time:', timing.loadEventEnd - timing.navigationStart, 'ms');
      console.log('DOM Content Loaded:', timing.domContentLoadedEventEnd - timing.navigationStart, 'ms');
      console.log('First Paint:', timing.responseEnd - timing.fetchStart, 'ms');
    }
    
    if (metrics.memoryInfo) {
      console.log('Memory Usage:', {
        used: `${(metrics.memoryInfo.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(metrics.memoryInfo.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(metrics.memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    }
    
    if (metrics.customMeasures.length > 0) {
      console.log('Custom Measures:', metrics.customMeasures.map(m => ({
        name: m.name,
        duration: `${m.duration.toFixed(2)} ms`,
      })));
    }
    
    console.groupEnd();
  }
}

/**
 * Monitor component render time
 */
export function measureComponentRender<T extends (...args: any[]) => any>(
  componentName: string,
  renderFn: T
): T {
  return ((...args: any[]) => {
    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;
    const measureName = `${componentName}-render`;
    
    markPerformance(startMark);
    const result = renderFn(...args);
    markPerformance(endMark);
    
    const duration = measurePerformance(measureName, startMark, endMark);
    
    if (import.meta.env.DEV && duration !== null && duration > 16) {
      console.warn(`⚠️ Slow component render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}

/**
 * Report performance metrics to analytics (production)
 */
export function reportPerformanceMetrics(): void {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // Wait for page to fully load
    window.addEventListener('load', async () => {
      // Delay to ensure all metrics are captured
      setTimeout(async () => {
        const vitals = await getWebVitals();
        const metrics = getPerformanceMetrics();
        
        // In production, you would send these to your analytics service
        // Example: sendToAnalytics('performance', { vitals, metrics });
        
        // For now, we'll just store in sessionStorage for debugging
        try {
          sessionStorage.setItem('performance-vitals', JSON.stringify(vitals));
          sessionStorage.setItem('performance-metrics', JSON.stringify({
            navigationTiming: metrics.navigationTiming ? {
              pageLoadTime: metrics.navigationTiming.loadEventEnd - metrics.navigationTiming.navigationStart,
              domContentLoaded: metrics.navigationTiming.domContentLoadedEventEnd - metrics.navigationTiming.navigationStart,
            } : null,
            memoryInfo: metrics.memoryInfo,
            resourceCount: metrics.resourceTimings.length,
          }));
        } catch (error) {
          console.warn('Failed to store performance metrics', error);
        }
      }, 3000);
    });
  }
}

/**
 * Get bundle size information
 */
export function getBundleInfo(): { totalSize: number; resources: Array<{ name: string; size: number; type: string }> } {
  const info = {
    totalSize: 0,
    resources: [] as Array<{ name: string; size: number; type: string }>,
  };
  
  if (typeof window === 'undefined' || !window.performance) {
    return info;
  }
  
  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  resources.forEach(resource => {
    const size = resource.transferSize || resource.encodedBodySize || 0;
    info.totalSize += size;
    
    const urlParts = resource.name.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'unknown';
    
    let type = 'other';
    if (resource.name.endsWith('.js')) type = 'script';
    else if (resource.name.endsWith('.css')) type = 'stylesheet';
    else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) type = 'image';
    else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/)) type = 'font';
    
    info.resources.push({
      name: fileName,
      size,
      type,
    });
  });
  
  return info;
}

/**
 * Check if app is running slow and warn user
 */
export function checkPerformanceHealth(): {
  healthy: boolean;
  issues: string[];
  recommendations: string[];
} {
  const health = {
    healthy: true,
    issues: [] as string[],
    recommendations: [] as string[],
  };
  
  if (typeof window === 'undefined' || !window.performance) {
    return health;
  }
  
  const metrics = getPerformanceMetrics();
  
  // Check memory usage
  if (metrics.memoryInfo) {
    const usagePercent = (metrics.memoryInfo.usedJSHeapSize / metrics.memoryInfo.jsHeapSizeLimit) * 100;
    if (usagePercent > 90) {
      health.healthy = false;
      health.issues.push('High memory usage detected');
      health.recommendations.push('Clear browser cache and restart the app');
    }
  }
  
  // Check page load time
  if (metrics.navigationTiming) {
    const loadTime = metrics.navigationTiming.loadEventEnd - metrics.navigationTiming.navigationStart;
    if (loadTime > 5000) {
      health.healthy = false;
      health.issues.push('Slow page load time');
      health.recommendations.push('Check your internet connection');
    }
  }
  
  // Check number of resources
  if (metrics.resourceTimings.length > 100) {
    health.healthy = false;
    health.issues.push('Too many resources loaded');
    health.recommendations.push('Clear app cache to improve performance');
  }
  
  return health;
}
