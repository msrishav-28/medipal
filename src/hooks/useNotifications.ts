import { useState, useEffect, useCallback } from 'react';
import { 
  NotificationPermissionState, 
  NotificationSettings 
} from '@/types';
import { notificationService, notificationScheduler } from '@/services';

export interface UseNotificationsReturn {
  // Permission state
  permissionState: NotificationPermissionState;
  requestPermission: () => Promise<NotificationPermissionState>;
  
  // Settings
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // Testing
  testNotification: () => Promise<void>;
  
  // Status
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  handleMedicationTaken: (reminderId: string) => Promise<void>;
  handleMedicationSnooze: (reminderId: string, minutes: number) => Promise<void>;
  handleMedicationSkip: (reminderId: string, reason?: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    granted: false,
    denied: false,
    default: true
  });
  const [settings, setSettings] = useState<NotificationSettings>({
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
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize notification service
  useEffect(() => {
    const initialize = async () => {
      try {
        setPermissionState(notificationService.getPermissionState());
        setSettings(notificationService.getSettings());
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
        console.error('Failed to initialize notifications:', err);
      }
    };

    initialize();
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'MEDICATION_TAKEN':
          handleMedicationTaken(data.reminderId);
          break;
        case 'MEDICATION_SNOOZED':
          handleMedicationSnooze(data.reminderId, 10); // Default 10 minutes
          break;
        case 'MEDICATION_SKIPPED':
          handleMedicationSkip(data.reminderId);
          break;
        case 'NOTIFICATION_CLICKED':
          // Handle notification click
          console.log('Notification clicked:', data);
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Listen for custom notification events
  useEffect(() => {
    const handleNotificationAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { action, data } = customEvent.detail;
      
      switch (action) {
        case 'taken':
          void handleMedicationTaken(data.reminderId);
          break;
        case 'snooze':
          void handleMedicationSnooze(data.reminderId, 10);
          break;
        case 'skip':
          void handleMedicationSkip(data.reminderId);
          break;
      }
    };

    window.addEventListener('notification-action', handleNotificationAction);

    return () => {
      window.removeEventListener('notification-action', handleNotificationAction);
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    try {
      const newPermissionState = await notificationService.requestPermission();
      setPermissionState(newPermissionState);
      setError(null);
      return newPermissionState;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request notification permission';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    try {
      await notificationService.updateSettings(newSettings);
      setSettings(notificationService.getSettings());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const testNotification = useCallback(async (): Promise<void> => {
    try {
      await notificationService.testNotification();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show test notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const handleMedicationTaken = useCallback(async (reminderId: string): Promise<void> => {
    try {
      // Mark reminder as taken
      await notificationScheduler.handleMedicationTaken(reminderId);
      
      // Dispatch custom event for other components to listen to
      const event = new CustomEvent('medication-taken', {
        detail: { reminderId }
      });
      window.dispatchEvent(event);
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark medication as taken';
      setError(errorMessage);
      console.error('Failed to handle medication taken:', err);
    }
  }, []);

  const handleMedicationSnooze = useCallback(async (reminderId: string, minutes: number): Promise<void> => {
    try {
      // Snooze the reminder
      await notificationScheduler.handleMedicationSnooze(reminderId, minutes);
      
      // Dispatch custom event
      const event = new CustomEvent('medication-snoozed', {
        detail: { reminderId, minutes }
      });
      window.dispatchEvent(event);
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to snooze medication';
      setError(errorMessage);
      console.error('Failed to snooze medication:', err);
    }
  }, []);

  const handleMedicationSkip = useCallback(async (reminderId: string, reason?: string): Promise<void> => {
    try {
      // Skip the reminder
      await notificationScheduler.handleMedicationSkip(reminderId, reason);
      
      // Dispatch custom event
      const event = new CustomEvent('medication-skipped', {
        detail: { reminderId, reason }
      });
      window.dispatchEvent(event);
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to skip medication';
      setError(errorMessage);
      console.error('Failed to skip medication:', err);
    }
  }, []);

  return {
    permissionState,
    requestPermission,
    settings,
    updateSettings,
    testNotification,
    isInitialized,
    error,
    handleMedicationTaken,
    handleMedicationSnooze,
    handleMedicationSkip
  };
}
