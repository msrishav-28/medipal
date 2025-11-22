// Notification system types
export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  userId: string;
  scheduledTime: Date;
  medicationName: string;
  dosage: string;
  instructions?: string;
  pillImage?: string;
  snoozeCount: number;
  maxSnoozes: number;
  isActive: boolean;
  createdAt: Date;
}

export interface NotificationSchedule {
  id: string;
  medicationId: string;
  userId: string;
  time: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, Sunday = 0
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data: {
    type: 'medication-reminder' | 'refill-reminder' | 'caregiver-alert' | 'missed-dose' | 'critical-medication' | 'weekly-report';
    medicationId?: string;
    reminderId?: string;
    userId: string;
    caregiverId?: string;
    patientId?: string;
    timestamp: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface CaregiverNotification {
  id: string;
  caregiverId: string;
  patientId: string;
  type: 'missed-dose' | 'critical-medication' | 'weekly-report' | 'emergency';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  medicationId?: string;
  medicationName?: string;
  scheduledTime?: Date;
  isRead: boolean;
  isSent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

export interface CaregiverNotificationDelivery {
  id: string;
  notificationId: string;
  caregiverId: string;
  deliveryMethod: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed';
  recipient: string; // email address or phone number
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  reminderSound: 'default' | 'gentle' | 'urgent';
  snoozeOptions: number[]; // minutes
  maxSnoozes: number;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}