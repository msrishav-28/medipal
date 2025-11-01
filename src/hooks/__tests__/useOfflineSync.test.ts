import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineSync } from '../useOfflineSync';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('useOfflineSync', () => {
  beforeEach(() => {
    localStorage.clear();
    navigator.onLine = true;
    vi.clearAllMocks();
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.pendingActions).toHaveLength(0);
    expect(result.current.hasPendingActions).toBe(false);
  });

  it('should detect offline status', () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('should detect online status', () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should add offline actions', () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.addOfflineAction({
        type: 'create',
        entity: 'medication',
        data: { name: 'Test Med' }
      });
    });

    expect(result.current.pendingActions).toHaveLength(1);
    expect(result.current.hasPendingActions).toBe(true);
    expect(result.current.pendingActions[0].type).toBe('create');
    expect(result.current.pendingActions[0].entity).toBe('medication');
  });

  it('should persist pending actions to localStorage', () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.addOfflineAction({
        type: 'update',
        entity: 'user',
        data: { name: 'Updated User' }
      });
    });

    const stored = localStorage.getItem('offline-actions');
    expect(stored).toBeTruthy();
    
    const parsedActions = JSON.parse(stored!);
    expect(parsedActions).toHaveLength(1);
    expect(parsedActions[0].type).toBe('update');
  });

  it('should load pending actions from localStorage on mount', () => {
    const testActions = [{
      id: 'test-id',
      type: 'create',
      entity: 'medication',
      data: { name: 'Test Med' },
      timestamp: Date.now()
    }];

    localStorage.setItem('offline-actions', JSON.stringify(testActions));

    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.pendingActions).toHaveLength(1);
    expect(result.current.pendingActions[0].id).toBe('test-id');
  });

  it('should clear pending actions', () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.addOfflineAction({
        type: 'create',
        entity: 'medication',
        data: { name: 'Test Med' }
      });
    });

    expect(result.current.pendingActions).toHaveLength(1);

    act(() => {
      result.current.clearPendingActions();
    });

    expect(result.current.pendingActions).toHaveLength(0);
    expect(localStorage.getItem('offline-actions')).toBeNull();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem('offline-actions', 'invalid-json');

    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.pendingActions).toHaveLength(0);
    expect(localStorage.getItem('offline-actions')).toBeNull();
  });
});