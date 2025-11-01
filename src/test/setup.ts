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