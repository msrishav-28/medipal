import { 
  NotificationPermissionState, 
  MedicationReminder, 
  PushNotificationPayload, 
  NotificationSettings 
} from '@/types';
import { voiceService } from './voiceService';

export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private settings: NotificationSettings = {
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
  };

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    try {
      // Register service worker if available
      if ('serviceWorker' in navigator) {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      }

      // Load user notification settings
      await this.loadSettings();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  /**
   * Get current notification permission state
   */
  getPermissionState(): NotificationPermissionState {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  /**
   * Schedule a medication reminder notification
   */
  async scheduleReminder(reminder: MedicationReminder): Promise<void> {
    const permission = this.getPermissionState();
    if (!permission.granted) {
      throw new Error('Notification permission not granted');
    }

    // Check if we're in quiet hours
    if (this.isQuietHours()) {
      console.log('Skipping notification due to quiet hours');
      return;
    }

    const now = new Date();
    const scheduledTime = new Date(reminder.scheduledTime);
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Show notification immediately
      await this.showNotification(reminder);
    } else {
      // Schedule for later
      setTimeout(() => {
        this.showNotification(reminder);
      }, delay);
    }
  }

  /**
   * Show a medication reminder notification
   */
  private async showNotification(reminder: MedicationReminder): Promise<void> {
    // Speak the reminder if voice is enabled
    try {
      await voiceService.speakReminder(reminder);
    } catch (error) {
      console.warn('Failed to speak reminder:', error);
    }
    const payload: PushNotificationPayload = {
      title: 'Medication Reminder',
      body: `Time to take ${reminder.medicationName} (${reminder.dosage})`,
      icon: '/icons/pill-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        type: 'medication-reminder',
        medicationId: reminder.medicationId,
        reminderId: reminder.id,
        userId: reminder.userId,
        timestamp: new Date().toISOString()
      },
      actions: [
        {
          action: 'taken',
          title: 'I took it',
          icon: '/icons/check-icon.png'
        },
        {
          action: 'snooze',
          title: 'Snooze 10 min',
          icon: '/icons/snooze-icon.png'
        },
        {
          action: 'skip',
          title: 'Skip dose',
          icon: '/icons/skip-icon.png'
        }
      ]
    };
    
    // Add optional image if present
    if (reminder.pillImage !== undefined) {
      payload.image = reminder.pillImage;
    };

    if (this.registration) {
      // Use service worker for background notifications
      const options: any = {
        body: payload.body,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: true,
        silent: !this.settings.sound,
        vibrate: this.settings.vibration ? [200, 100, 200] : undefined
      };
      
      // Add optional properties conditionally
      if (payload.icon !== undefined) {
        options.icon = payload.icon;
      }
      if (payload.badge !== undefined) {
        options.badge = payload.badge;
      }
      if (payload.image !== undefined) {
        options.image = payload.image;
      }
      
      await this.registration.showNotification(payload.title, options);
    } else {
      // Fallback to basic notification
      const options: NotificationOptions = {
        body: payload.body,
        data: payload.data,
        requireInteraction: true,
        silent: !this.settings.sound
      };
      
      // Add optional icon if present
      if (payload.icon !== undefined) {
        options.icon = payload.icon;
      }
      
      const notification = new Notification(payload.title, options);

      // Handle notification click
      notification.onclick = () => {
        this.handleNotificationClick('taken', payload.data);
        notification.close();
      };
    }
  }

  /**
   * Handle notification action clicks
   */
  async handleNotificationClick(action: string, data: any): Promise<void> {
    const event = new CustomEvent('notification-action', {
      detail: { action, data }
    });
    window.dispatchEvent(event);
  }

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(reminderId: string): Promise<void> {
    // In a real implementation, this would cancel the scheduled notification
    // For now, we'll just log it
    console.log('Cancelling reminder:', reminderId);
  }

  /**
   * Snooze a reminder for the specified number of minutes
   */
  async snoozeReminder(reminder: MedicationReminder, minutes: number): Promise<void> {
    if (reminder.snoozeCount >= this.settings.maxSnoozes) {
      throw new Error('Maximum snooze limit reached');
    }

    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);

    const snoozedReminder: MedicationReminder = {
      ...reminder,
      scheduledTime: snoozeTime,
      snoozeCount: reminder.snoozeCount + 1
    };

    await this.scheduleReminder(snoozedReminder);
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startParts = this.settings.quietHours.start.split(':').map(Number);
    const endParts = this.settings.quietHours.end.split(':').map(Number);
    
    const startHour = startParts[0];
    const startMin = startParts[1];
    const endHour = endParts[0];
    const endMin = endParts[1];
    
    // Validate parsed values
    if (startHour === undefined || startMin === undefined || 
        endHour === undefined || endMin === undefined) {
      return false;
    }
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 - 23:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 07:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  /**
   * Get current notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Load settings from local storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem('notification-settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  /**
   * Save settings to local storage
   */
  private async saveSettings(): Promise<void> {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * Test notification functionality
   */
  async testNotification(): Promise<void> {
    const permission = this.getPermissionState();
    if (!permission.granted) {
      throw new Error('Notification permission not granted');
    }

    const testReminder: MedicationReminder = {
      id: 'test-reminder',
      medicationId: 'test-medication',
      userId: 'test-user',
      scheduledTime: new Date(),
      medicationName: 'Test Medication',
      dosage: '100mg',
      instructions: 'This is a test notification',
      snoozeCount: 0,
      maxSnoozes: 3,
      isActive: true,
      createdAt: new Date()
    };

    await this.showNotification(testReminder);
  }
}

export const notificationService = NotificationService.getInstance();