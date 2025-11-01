import { useState, useEffect, useCallback } from 'react';
import { 
  NotificationPermissionState, 
  NotificationSettings, 
  MedicationReminder 
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
    // const handleNotificationAction
      switch (action) {
        case 'taken':
          handleMedicationTaken(data.reminderId);
          break;
        case 'snooze':
          handleMedicationSnooze(data.reminderId, 10);
          break;
        case 'skip':
          handleMedicationSkip(data.reminderId);
          break;
      }
    };

    window.addEventListener('notification-action', handleNotificationAction as EventListener);

    return () => {
      window.removeEventListener('notification-action', handleNotificationAction as EventListener);
    };
  }, []);

  // const requestPermission
      setPermissionState(newPermissionState);
      setError(null);
      return newPermissionState;
    } catch (err) {
      // const errorMessage
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // const updateSettings
      setSettings(notificationService.getSettings());
      setError(null);
    } catch (err) {
      // const errorMessage
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // const testNotification
      setError(null);
    } catch (err) {
      // const errorMessage
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // const handleMedicationTaken
      // Dispatch custom event for other components to listen to
      // const event
      window.dispatchEvent(event);
      
      setError(null);
    } catch (err) {
      // const errorMessage
      setError(errorMessage);
      console.error('Failed to handle medication taken:', err);
    }
  }, []);

  // const handleMedicationSnooze
      // Dispatch custom event
      // const event
      window.dispatchEvent(event);
      
      setError(null);
    } catch (err) {
      // const errorMessage
      setError(errorMessage);
      console.error('Failed to snooze medication:', err);
    }
  }, []);

  // const handleMedicationSkip
      // Dispatch custom event
      // const event
      window.dispatchEvent(event);
      
      setError(null);
    } catch (err) {
      // const errorMessage
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
