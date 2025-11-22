import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

// Mock the notification service
vi.mock('@/services', () => ({
  notificationService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getPermissionState: vi.fn().mockReturnValue({
      granted: false,
      denied: false,
      default: true
    }),
    getSettings: vi.fn().mockReturnValue({
      enabled: true,
      sound: true,
      vibration: true,
      badge: true,
      reminderSound: 'default',
      snoozeOptions: [5, 10, 15],
      maxSnoozes: 3,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      }
    }),
    requestPermission: vi.fn(),
    updateSettings: vi.fn(),
    testNotification: vi.fn()
  },
  notificationScheduler: {
    handleMedicationTaken: vi.fn(),
    handleMedicationSnooze: vi.fn(),
    handleMedicationSkip: vi.fn()
  }
}));

// Mock service worker
Object.defineProperty(globalThis, 'navigator', {
  value: {
    ...globalThis.navigator,
    serviceWorker: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  },
  writable: true
});

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.permissionState.default).toBe(true);
    });

    it('should initialize notification service on mount', async () => {
      const { notificationService } = await import('@/services');
      
      renderHook(() => useNotifications());

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(notificationService.initialize).toHaveBeenCalled();
    });

    it('should handle initialization error', async () => {
      const { notificationService } = await import('@/services');
      notificationService.initialize = vi.fn().mockRejectedValue(new Error('Init failed'));

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('Init failed');
    });
  });

  describe('permission management', () => {
    it('should request notification permission', async () => {
      const { notificationService } = await import('@/services');
      const mockPermissionState = {
        granted: true,
        denied: false,
        default: false
      };
      
      notificationService.requestPermission = vi.fn().mockResolvedValue(mockPermissionState);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        const permissionState = await result.current.requestPermission();
        expect(permissionState).toEqual(mockPermissionState);
      });

      expect(notificationService.requestPermission).toHaveBeenCalled();
    });

    it('should handle permission request error', async () => {
      const { notificationService } = await import('@/services');
      notificationService.requestPermission = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await expect(result.current.requestPermission()).rejects.toThrow('Permission denied');
      });

      expect(result.current.error).toBe('Permission denied');
    });
  });

  describe('settings management', () => {
    it('should update notification settings', async () => {
      const { notificationService } = await import('@/services');
      const newSettings = { enabled: false, sound: false };
      
      notificationService.updateSettings = vi.fn().mockResolvedValue(undefined);
      notificationService.getSettings = vi.fn().mockReturnValue({
        enabled: false,
        sound: false,
        vibration: true,
        badge: true,
        reminderSound: 'default',
        snoozeOptions: [5, 10, 15],
        maxSnoozes: 3,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        }
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.updateSettings(newSettings);
      });

      expect(notificationService.updateSettings).toHaveBeenCalledWith(newSettings);
    });

    it('should handle settings update error', async () => {
      const { notificationService } = await import('@/services');
      notificationService.updateSettings = vi.fn().mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await expect(result.current.updateSettings({ enabled: false }))
          .rejects.toThrow('Update failed');
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('test notification', () => {
    it('should send test notification', async () => {
      const { notificationService } = await import('@/services');
      notificationService.testNotification = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.testNotification();
      });

      expect(notificationService.testNotification).toHaveBeenCalled();
    });

    it('should handle test notification error', async () => {
      const { notificationService } = await import('@/services');
      notificationService.testNotification = vi.fn().mockRejectedValue(new Error('Test failed'));

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await expect(result.current.testNotification()).rejects.toThrow('Test failed');
      });

      expect(result.current.error).toBe('Test failed');
    });
  });

  describe('medication actions', () => {
    it('should handle medication taken', async () => {
      const { notificationScheduler } = await import('@/services');
      notificationScheduler.handleMedicationTaken = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.handleMedicationTaken('reminder-1');
      });

      expect(notificationScheduler.handleMedicationTaken).toHaveBeenCalledWith('reminder-1');
    });

    it('should handle medication snooze', async () => {
      const { notificationScheduler } = await import('@/services');
      notificationScheduler.handleMedicationSnooze = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.handleMedicationSnooze('reminder-1', 10);
      });

      expect(notificationScheduler.handleMedicationSnooze).toHaveBeenCalledWith('reminder-1', 10);
    });

    it('should handle medication skip', async () => {
      const { notificationScheduler } = await import('@/services');
      notificationScheduler.handleMedicationSkip = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.handleMedicationSkip('reminder-1', 'Feeling unwell');
      });

      expect(notificationScheduler.handleMedicationSkip).toHaveBeenCalledWith('reminder-1', 'Feeling unwell');
    });

    it('should dispatch custom events for medication actions', async () => {
      const { notificationScheduler } = await import('@/services');
      notificationScheduler.handleMedicationTaken = vi.fn().mockResolvedValue(undefined);

      const eventSpy = vi.spyOn(window, 'dispatchEvent');

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.handleMedicationTaken('reminder-1');
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'medication-taken',
          detail: expect.objectContaining({
            reminderId: 'reminder-1'
          })
        })
      );
    });
  });

  describe('service worker integration', () => {
    it('should listen for service worker messages', () => {
      renderHook(() => useNotifications());

      expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should clean up service worker listeners on unmount', () => {
      const { unmount } = renderHook(() => useNotifications());

      unmount();

      expect(navigator.serviceWorker.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });

  describe('custom event handling', () => {
    it('should listen for notification action events', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useNotifications());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'notification-action',
        expect.any(Function)
      );
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useNotifications());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'notification-action',
        expect.any(Function)
      );
    });
  });
});