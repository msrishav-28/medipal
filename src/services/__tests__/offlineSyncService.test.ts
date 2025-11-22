import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineSyncService } from '../offlineSyncService';
import { db } from '../database';

// Mock the database
vi.mock('../database', () => ({
  db: {
    table: vi.fn(() => ({
      add: vi.fn(),
      toArray: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      clear: vi.fn(),
    })),
  },
}));

describe('OfflineSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('queueAction', () => {
    it('should queue an action for later sync', async () => {
      const mockAdd = vi.fn().mockResolvedValue(undefined);
      (db.table as any).mockReturnValue({ add: mockAdd });

      await offlineSyncService.queueAction('intake-create', {
        medicationId: 'med-1',
        status: 'taken',
      });

      expect(db.table).toHaveBeenCalledWith('pendingActions');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'intake-create',
          payload: { medicationId: 'med-1', status: 'taken' },
          retryCount: 0,
        })
      );
    });

    it('should include timestamp when queueing', async () => {
      const mockAdd = vi.fn().mockResolvedValue(undefined);
      (db.table as any).mockReturnValue({ add: mockAdd });

      const beforeTime = Date.now();
      await offlineSyncService.queueAction('medication-update', { name: 'Test' });
      const afterTime = Date.now();

      expect(mockAdd).toHaveBeenCalled();
      const calledWith = mockAdd.mock.calls[0]?.[0];
      expect(calledWith).toBeDefined();
      
      const timestamp = new Date(calledWith.timestamp).getTime();

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getPendingCount', () => {
    it('should return count of pending actions', async () => {
      const mockCount = vi.fn().mockResolvedValue(5);
      (db.table as any).mockReturnValue({ count: mockCount });

      const count = await offlineSyncService.getPendingCount();

      expect(count).toBe(5);
      expect(db.table).toHaveBeenCalledWith('pendingActions');
    });

    it('should return 0 when no pending actions', async () => {
      const mockCount = vi.fn().mockResolvedValue(0);
      (db.table as any).mockReturnValue({ count: mockCount });

      const count = await offlineSyncService.getPendingCount();

      expect(count).toBe(0);
    });
  });

  describe('clearAllPending', () => {
    it('should clear all pending actions', async () => {
      const mockClear = vi.fn().mockResolvedValue(undefined);
      (db.table as any).mockReturnValue({ clear: mockClear });

      await offlineSyncService.clearAllPending();

      expect(db.table).toHaveBeenCalledWith('pendingActions');
      expect(mockClear).toHaveBeenCalled();
    });
  });

  describe('processPendingActions', () => {
    it('should not process when offline', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const mockToArray = vi.fn();
      (db.table as any).mockReturnValue({ toArray: mockToArray });

      await offlineSyncService.processPendingActions();

      expect(mockToArray).not.toHaveBeenCalled();
    });

    it('should process all pending actions when online', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const mockActions = [
        {
          id: '1',
          type: 'intake-create',
          payload: { medicationId: 'med-1' },
          timestamp: new Date(),
          retryCount: 0,
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockActions);
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockUpdate = vi.fn().mockResolvedValue(undefined);

      (db.table as any).mockReturnValue({
        toArray: mockToArray,
        delete: mockDelete,
        update: mockUpdate,
      });

      await offlineSyncService.processPendingActions();

      expect(mockToArray).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('1');
    });

    it('should retry failed actions up to max retries', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const mockActions = [
        {
          id: '1',
          type: 'intake-create',
          payload: { medicationId: 'med-1' },
          timestamp: new Date(),
          retryCount: 2,
        },
      ];

      const mockToArray = vi.fn().mockResolvedValue(mockActions);
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockUpdate = vi.fn().mockResolvedValue(undefined);

      (db.table as any).mockReturnValue({
        toArray: mockToArray,
        delete: mockDelete,
        update: mockUpdate,
      });

      await offlineSyncService.processPendingActions();

      expect(mockToArray).toHaveBeenCalled();
    });

    it('should not run multiple syncs in parallel', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const mockToArray = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      (db.table as any).mockReturnValue({ toArray: mockToArray });

      // Start first sync
      const firstSync = offlineSyncService.processPendingActions();

      // Try to start second sync immediately
      const secondSync = offlineSyncService.processPendingActions();

      await Promise.all([firstSync, secondSync]);

      // Should only call toArray once since second sync should be skipped
      expect(mockToArray).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerBackgroundSync', () => {
    it('should register background sync if supported', async () => {
      const mockRegister = vi.fn().mockResolvedValue(undefined);
      const mockServiceWorkerReady = Promise.resolve({
        sync: { register: mockRegister },
      } as any);

      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: { ready: mockServiceWorkerReady },
      });

      await offlineSyncService.registerBackgroundSync();

      expect(mockRegister).toHaveBeenCalledWith('medication-sync');
    });

    it('should handle registration failure gracefully', async () => {
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));
      const mockServiceWorkerReady = Promise.resolve({
        sync: { register: mockRegister },
      } as any);

      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: { ready: mockServiceWorkerReady },
      });

      // Should not throw
      await expect(offlineSyncService.registerBackgroundSync()).resolves.not.toThrow();
    });
  });
});
