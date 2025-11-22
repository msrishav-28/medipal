import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineState } from '../useOfflineState';
import { offlineSyncService } from '@/services/offlineSyncService';

// Mock the offline sync service
vi.mock('@/services/offlineSyncService', () => ({
  offlineSyncService: {
    queueAction: vi.fn(),
    getPendingCount: vi.fn(),
    processPendingActions: vi.fn(),
  },
}));

describe('useOfflineState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with online status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    const { result } = renderHook(() => useOfflineState());

    expect(result.current.isOnline).toBe(true);
  });

  it('should initialize with offline status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    const { result } = renderHook(() => useOfflineState());

    expect(result.current.isOnline).toBe(false);
  });

  it('should get initial pending count', async () => {
    (offlineSyncService.getPendingCount as any).mockResolvedValue(5);

    const { result } = renderHook(() => useOfflineState());

    await waitFor(() => {
      expect(result.current.pendingActionsCount).toBe(5);
    });

    expect(offlineSyncService.getPendingCount).toHaveBeenCalled();
  });

  it('should update online status on online event', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    const { result } = renderHook(() => useOfflineState());

    expect(result.current.isOnline).toBe(false);

    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it('should update online status on offline event', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    const { result } = renderHook(() => useOfflineState());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
  });

  it('should queue actions', async () => {
    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);
    (offlineSyncService.queueAction as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineState());

    await act(async () => {
      await result.current.queueAction('intake-create', { medicationId: 'med-1' });
    });

    expect(offlineSyncService.queueAction).toHaveBeenCalledWith(
      'intake-create',
      { medicationId: 'med-1' }
    );
  });

  it('should update pending count after queueing action', async () => {
    (offlineSyncService.getPendingCount as any)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    (offlineSyncService.queueAction as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineState());

    await waitFor(() => {
      expect(result.current.pendingActionsCount).toBe(0);
    });

    await act(async () => {
      await result.current.queueAction('intake-create', { medicationId: 'med-1' });
    });

    await waitFor(() => {
      expect(result.current.pendingActionsCount).toBe(1);
    });
  });

  it('should process pending actions', async () => {
    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);
    (offlineSyncService.processPendingActions as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineState());

    await act(async () => {
      await result.current.processPendingActions();
    });

    expect(offlineSyncService.processPendingActions).toHaveBeenCalled();
  });

  it('should update pending count after processing', async () => {
    (offlineSyncService.getPendingCount as any)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);
    (offlineSyncService.processPendingActions as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineState());

    await waitFor(() => {
      expect(result.current.pendingActionsCount).toBe(5);
    });

    await act(async () => {
      await result.current.processPendingActions();
    });

    await waitFor(() => {
      expect(result.current.pendingActionsCount).toBe(0);
    });
  });

  it('should poll for pending count updates', async () => {
    (offlineSyncService.getPendingCount as any)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(3);

    const { result } = renderHook(() => useOfflineState());

    await waitFor(() => {
      expect(result.current.pendingActionsCount).toBe(0);
    });

    // Advance timer by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.pendingActionsCount).toBe(3);
    });

    expect(offlineSyncService.getPendingCount).toHaveBeenCalledTimes(2);
  });

  it('should cleanup event listeners on unmount', () => {
    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOfflineState());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
