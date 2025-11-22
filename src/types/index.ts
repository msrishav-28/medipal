// Type definitions
export interface User {
  id: string;
  name: string;
  age: number;
  profilePhoto?: string;
  preferences: UserPreferences;
  caregivers: Caregiver[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  voiceEnabled: boolean;
  language: string;
  notificationSound: string;
  accessibilityMode: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
}

export interface Caregiver {
  id: string;
  patientId: string;
  name: string;
  email: string;
  phone?: string;
  relationship: string;
  accessLevel: 'view' | 'manage';
  isActive: boolean;
  accessCode?: string | undefined;
  accessCodeExpiry?: Date | undefined;
  lastAccess?: Date | undefined;
  notificationPreferences: {
    missedDose: boolean;
    criticalMedication: boolean;
    weeklyReport: boolean;
    smsEnabled: boolean;
    emailEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessCode {
  id: string;
  code: string;
  patientId: string;
  caregiverId?: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface CaregiverActivity {
  id: string;
  caregiverId: string;
  patientId: string;
  action: 'view_dashboard' | 'mark_taken' | 'view_report' | 'update_settings';
  details?: string | undefined;
  timestamp: Date;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection';
  scheduleType: 'time-based' | 'interval-based';
  times?: string[]; // ['08:00', '20:00']
  interval?: number; // hours
  instructions?: string;
  pillImage?: string;
  startDate: Date;
  endDate?: Date;
  refillReminder: number; // days before running out
  totalPills: number;
  remainingPills: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntakeRecord {
  id: string;
  medicationId: string;
  userId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'taken' | 'missed' | 'skipped';
  skipReason?: string;
  snoozeCount: number;
  confirmedBy: 'patient' | 'caregiver';
  location?: string;
  createdAt: Date;
}

// Re-export notification types
export * from './notification';
