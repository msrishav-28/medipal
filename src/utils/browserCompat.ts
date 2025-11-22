/**
 * Cross-Browser Compatibility Utilities
 * Detects browser features and provides fallbacks
 */

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface FeatureSupport {
  serviceWorker: boolean;
  pushNotifications: boolean;
  webSpeechAPI: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  geolocation: boolean;
  camera: boolean;
  webGL: boolean;
  webWorkers: boolean;
  intersectionObserver: boolean;
  mutationObserver: boolean;
  performanceObserver: boolean;
  resizeObserver: boolean;
  cssGrid: boolean;
  cssFlexbox: boolean;
  cssCustomProperties: boolean;
  es6: boolean;
  touchEvents: boolean;
  pointerEvents: boolean;
}

/**
 * Detect browser information
 */
export function detectBrowser(): BrowserInfo {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  
  // Detect browser name and version
  if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox';
    version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    name = 'Chrome';
    version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    name = 'Safari';
    version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edg') > -1) {
    name = 'Edge';
    version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    name = 'Opera';
    version = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }
  
  // Detect platform
  const platform = navigator.platform || 'Unknown';
  
  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  return {
    name,
    version,
    platform,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Check feature support across browsers
 */
export function checkFeatureSupport(): FeatureSupport {
  const support: FeatureSupport = {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window && 'Notification' in window,
    webSpeechAPI: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    indexedDB: 'indexedDB' in window,
    localStorage: (() => {
      try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })(),
    sessionStorage: (() => {
      try {
        const test = '__sessionStorage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })(),
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl')
        );
      } catch {
        return false;
      }
    })(),
    webWorkers: 'Worker' in window,
    intersectionObserver: 'IntersectionObserver' in window,
    mutationObserver: 'MutationObserver' in window,
    performanceObserver: 'PerformanceObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssCustomProperties: CSS.supports('--custom', 'property'),
    es6: (() => {
      try {
        // Test for arrow functions, let, const, etc.
        eval('const test = () => true');
        return true;
      } catch {
        return false;
      }
    })(),
    touchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pointerEvents: 'PointerEvent' in window,
  };
  
  return support;
}

/**
 * Get unsupported features that may affect functionality
 */
export function getUnsupportedFeatures(): string[] {
  const support = checkFeatureSupport();
  const unsupported: string[] = [];
  
  // Critical features
  if (!support.indexedDB) unsupported.push('IndexedDB (offline storage will not work)');
  if (!support.serviceWorker) unsupported.push('Service Workers (offline mode unavailable)');
  if (!support.localStorage) unsupported.push('Local Storage (preferences will not persist)');
  
  // Important features
  if (!support.pushNotifications) unsupported.push('Push Notifications (medication reminders may be limited)');
  if (!support.webSpeechAPI) unsupported.push('Web Speech API (voice input unavailable)');
  if (!support.camera) unsupported.push('Camera API (prescription scanning unavailable)');
  
  // Nice-to-have features
  if (!support.intersectionObserver) unsupported.push('Intersection Observer (lazy loading may be affected)');
  if (!support.cssGrid) unsupported.push('CSS Grid (layout may be affected)');
  
  return unsupported;
}

/**
 * Check if browser is supported
 */
export function isBrowserSupported(): { supported: boolean; reason?: string; warnings: string[] } {
  const browser = detectBrowser();
  const unsupportedFeatures = getUnsupportedFeatures();
  
  // Define minimum browser versions
  const minVersions: Record<string, number> = {
    Chrome: 90,
    Firefox: 88,
    Safari: 14,
    Edge: 90,
    Opera: 76,
  };
  
  const currentVersion = parseFloat(browser.version);
  const minVersion = minVersions[browser.name];
  
  // Check if browser version is too old
  if (minVersion && currentVersion < minVersion) {
    return {
      supported: false,
      reason: `Your browser version (${browser.name} ${browser.version}) is outdated. Please update to ${browser.name} ${minVersion} or later.`,
      warnings: unsupportedFeatures,
    };
  }
  
  // Check for critical missing features
  const criticalFeatures = unsupportedFeatures.filter(f =>
    f.includes('IndexedDB') || f.includes('Service Workers')
  );
  
  if (criticalFeatures.length > 0) {
    return {
      supported: false,
      reason: 'Your browser is missing critical features required for this application.',
      warnings: unsupportedFeatures,
    };
  }
  
  return {
    supported: true,
    warnings: unsupportedFeatures,
  };
}

/**
 * Display browser compatibility warning
 */
export function showCompatibilityWarning(): void {
  const { supported, reason, warnings } = isBrowserSupported();
  
  if (!supported && reason) {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #EF4444;
      color: white;
      padding: 16px;
      text-align: center;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    warningDiv.innerHTML = `
      <strong>⚠️ Browser Not Supported</strong><br>
      ${reason}<br>
      ${warnings.length > 0 ? `<small>Missing features: ${warnings.join(', ')}</small>` : ''}
    `;
    document.body.insertBefore(warningDiv, document.body.firstChild);
  } else if (warnings.length > 0) {
    console.warn('⚠️ Some browser features are not supported:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }
}

/**
 * Polyfill for missing features
 */
export function applyPolyfills(): void {
  // Polyfill for IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, loading polyfill...');
    // In a real app, you would dynamically load the polyfill here
  }
  
  // Polyfill for ResizeObserver
  if (!('ResizeObserver' in window)) {
    console.warn('ResizeObserver not supported, loading polyfill...');
    // In a real app, you would dynamically load the polyfill here
  }
  
  // Polyfill for closest() method (IE)
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (selector: string) {
      let el: Element | null = this;
      while (el) {
        if (el.matches(selector)) return el;
        el = el.parentElement;
      }
      return null;
    };
  }
  
  // Polyfill for matches() method (IE)
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      (Element.prototype as any).msMatchesSelector ||
      Element.prototype.webkitMatchesSelector;
  }
}

/**
 * Log browser compatibility information
 */
export function logCompatibilityInfo(): void {
  const browser = detectBrowser();
  const support = checkFeatureSupport();
  const { supported, warnings } = isBrowserSupported();
  
  console.group('🌐 Browser Compatibility Report');
  console.log(`Browser: ${browser.name} ${browser.version}`);
  console.log(`Platform: ${browser.platform}`);
  console.log(`Device: ${browser.isMobile ? 'Mobile' : browser.isTablet ? 'Tablet' : 'Desktop'}`);
  console.log(`Supported: ${supported ? '✅ Yes' : '❌ No'}`);
  
  if (warnings.length > 0) {
    console.warn('\nWarnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }
  
  console.log('\nFeature Support:');
  Object.entries(support).forEach(([feature, isSupported]) => {
    console.log(`  ${feature}: ${isSupported ? '✅' : '❌'}`);
  });
  
  console.groupEnd();
}

/**
 * Test for specific CSS feature support
 */
export function supportsCSSFeature(property: string, value: string): boolean {
  if (!CSS || !CSS.supports) {
    return false;
  }
  return CSS.supports(property, value);
}

/**
 * Get vendor prefix for CSS property
 */
export function getVendorPrefix(): string {
  const styles = window.getComputedStyle(document.documentElement) as CSSStyleDeclaration & { OLink?: string };
  const styleArray = Array.prototype.slice.call(styles) as string[];
  const match = styleArray.join('').match(/-(moz|webkit|ms)-/);
  const pre = match?.[1] || ((styles.OLink === '' && 'o') || '');
  
  return pre ? `-${pre}-` : '';
}

/**
 * Check if device has hover capability
 */
export function hasHoverCapability(): boolean {
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if device prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get optimal image format support
 */
export function getOptimalImageFormat(): 'webp' | 'jpeg' | 'png' {
  const canvas = document.createElement('canvas');
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  return 'jpeg';
}
