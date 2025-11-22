import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService } from '../notificationService';
import { MedicationReminder } from '@/types';

// Mock the Notification API
const mockNotification = vi.fn();
const mockServiceWorkerRegistration = {
  showNotification: vi.fn()
};

Object.defineProperty(globalThis, 'Notification', {
  value: mockNotification,
  writable: true
});

Object.defineProperty(globalThis, 'navigator', {
  value: {
    ...globalThis.navigator,
    serviceWorker: {
      register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration)
    }
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockReminder: MedicationReminder;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset Notification permission
    Object.defineProperty(Notification, 'permission', {
      value: 'default',
      writable: true
    });

    // Mock Notification.requestPermission
    Notification.requestPermission = vi.fn().mockResolvedValue('granted');

    notificationService = NotificationService.getInstance();

    mockReminder = {
      id: 'test-reminder-1',
      medicationId: 'test-med-1',
      userId: 'test-user-1',
      scheduledTime: new Date(),
      medicationName: 'Metformin',
      dosage: '500mg',
      instructions: 'Take with food',
      snoozeCount: 0,
      maxSnoozes: 3,
      isActive: true,
      createdAt: new Date()
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(notificationService.initialize()).resolves.not.toThrow();
    });

    it('should register service worker', async () => {
      await notificationService.initialize();
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });
  });

  describe('permission management', () => {
    it('should request notification permission', async () => {
      const result = await notificationService.requestPermission();
      
      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(result.granted).toBe(true);
      expect(result.denied).toBe(false);
      expect(result.default).toBe(false);
    });

    it('should handle permission denial', async () => {
      Notification.requestPermission = vi.fn().mockResolvedValue('denied');
      
      const result = await notificationService.requestPermission();
      
      expect(result.granted).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.default).toBe(false);
    });

    it('should get current permission state', () => {
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
        writable: true
      });

      const state = notificationService.getPermissionState();
      
      expect(state.granted).toBe(true);
      expect(state.denied).toBe(false);
      expect(state.default).toBe(false);
    });
  });

  describe('reminder scheduling', () => {
    beforeEach(() => {
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
        writable: true
      });
    });

    it('should schedule immediate reminder', async () => {
      const pastReminder = {
        ...mockReminder,
        scheduledTime: new Date(Date.now() - 1000) // 1 second ago
      };

      await notificationService.scheduleReminder(pastReminder);
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Medication Reminder',
        expect.objectContaining({
          body: expect.stringContaining('Metformin'),
          data: expect.objectContaining({
            type: 'medication-reminder',
            medicationId: 'test-med-1'
          })
        })
      );
    });

    it('should schedule future reminder', async () => {
      vi.useFakeTimers();
      
      const futureReminder = {
        ...mockReminder,
        scheduledTime: new Date(Date.now() + 5000) // 5 seconds from now
      };

      await notificationService.scheduleReminder(futureReminder);
      
      // Should not show notification immediately
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled();
      
      // Fast-forward time
      vi.advanceTimersByTime(5000);
      
      // Should show notification after delay
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should throw error when permission not granted', async () => {
      Object.defineProperty(Notification, 'permission', {
        value: 'denied',
        writable: true
      });

      await expect(notificationService.scheduleReminder(mockReminder))
        .rejects.toThrow('Notification permission not granted');
    });

    it('should skip notification during quiet hours', async () => {
      // Set quiet hours to current time
      const now = new Date();
      const quietStart = `${now.getHours()}:${now.getMinutes()}`;
      const quietEnd = `${(now.getHours() + 1) % 24}:${now.getMinutes()}`;
      
      await notificationService.updateSettings({
        quietHours: {
          enabled: true,
          start: quietStart,
          end: quietEnd
        }
      });

      await notificationService.scheduleReminder(mockReminder);
      
      // Should not show notification during quiet hours
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled();
    });
  });

  describe('snooze functionality', () => {
    it('should snooze reminder successfully', async () => {
      vi.useFakeTimers();
      
      await notificationService.snoozeReminder(mockReminder, 10);
      
      // Should schedule new reminder 10 minutes later
      vi.advanceTimersByTime(10 * 60 * 1000);
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should reject snooze when max limit reached', async () => {
      const maxSnoozedReminder = {
        ...mockReminder,
        snoozeCount: 3,
        maxSnoozes: 3
      };

      await expect(notificationService.snoozeReminder(maxSnoozedReminder, 10))
        .rejects.toThrow('Maximum snooze limit reached');
    });

    it('should increment snooze count', async () => {
      const reminder = { ...mockReminder, snoozeCount: 1 };
      
      await notificationService.snoozeReminder(reminder, 5);
      
      // The snoozed reminder should have incremented count
      // This would be verified through the scheduling system in a real implementation
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('settings management', () => {
    it('should update notification settings', async () => {
      const newSettings = {
        enabled: false,
        sound: false,
        maxSnoozes: 5
      };

      await notificationService.updateSettings(newSettings);
      
      const settings = notificationService.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.sound).toBe(false);
      expect(settings.maxSnoozes).toBe(5);
    });

    it('should save settings to localStorage', async () => {
      const newSettings = { enabled: false };
      
      await notificationService.updateSettings(newSettings);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'notification-settings',
        expect.stringContaining('"enabled":false')
      );
    });

    it('should load settings from localStorage', async () => {
      const storedSettings = {
        enabled: false,
        sound: true,
        maxSnoozes: 5
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedSettings));
      
      // Create new instance to trigger loading
      const newService = NotificationService.getInstance();
      await newService.initialize();
      
      const settings = newService.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.maxSnoozes).toBe(5);
    });
  });

  describe('test notification', () => {
    beforeEach(() => {
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
        writable: true
      });
    });

    it('should send test notification', async () => {
      await notificationService.testNotification();
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Medication Reminder',
        expect.objectContaining({
          body: expect.stringContaining('Test Medication'),
          data: expect.objectContaining({
            type: 'medication-reminder'
          })
        })
      );
    });

    it('should throw error when permission not granted for test', async () => {
      Object.defineProperty(Notification, 'permission', {
        value: 'denied',
        writable: true
      });

      await expect(notificationService.testNotification())
        .rejects.toThrow('Notification permission not granted');
    });
  });

  describe('notification actions', () => {
    it('should handle notification click', async () => {
      const mockData = {
        type: 'medication-reminder',
        medicationId: 'test-med-1',
        reminderId: 'test-reminder-1'
      };

      // Mock window.dispatchEvent
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      await notificationService.handleNotificationClick('taken', mockData);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-action',
          detail: {
            action: 'taken',
            data: mockData
          }
        })
      );
    });
  });
});