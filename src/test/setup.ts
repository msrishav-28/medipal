import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Mock IndexedDB for testing
import 'fake-indexeddb/auto';

// Mock crypto.randomUUID for tests
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  },
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock CSS.supports for jsdom
if (typeof CSS === 'undefined') {
  (global as any).CSS = {
    supports: () => true,
  };
} else if (!CSS.supports) {
  CSS.supports = () => true;
}

// Clean up after each test
afterEach(() => {
  // Clear localStorage
  localStorage.clear();
  
  // Reset navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });
});