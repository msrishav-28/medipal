import Dexie, { Table } from 'dexie';
import { User, Medication, IntakeRecord, Caregiver, AccessCode, CaregiverActivity } from '@/types';
import { CaregiverNotification, CaregiverNotificationDelivery } from '@/types/notification';

export interface DatabaseUser extends Omit<User, 'createdAt' | 'updatedAt'> {
  createdAt: number;
  updatedAt: number;
}

export interface DatabaseMedication extends Omit<Medication, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> {
  startDate: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DatabaseIntakeRecord extends Omit<IntakeRecord, 'scheduledTime' | 'actualTime' | 'createdAt'> {
  scheduledTime: number;
  actualTime?: number;
  createdAt: number;
}

export interface DatabaseCaregiver extends Omit<Caregiver, 'accessCodeExpiry' | 'lastAccess' | 'createdAt' | 'updatedAt'> {
  accessCodeExpiry?: number;
  lastAccess?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DatabaseAccessCode extends Omit<AccessCode, 'expiresAt' | 'createdAt'> {
  expiresAt: number;
  createdAt: number;
}

export interface DatabaseCaregiverActivity extends Omit<CaregiverActivity, 'timestamp'> {
  timestamp: number;
}

export interface DatabaseCaregiverNotification extends Omit<CaregiverNotification, 'scheduledTime' | 'sentAt' | 'createdAt'> {
  scheduledTime?: number;
  sentAt?: number;
  createdAt: number;
}

export interface DatabaseCaregiverNotificationDelivery extends Omit<CaregiverNotificationDelivery, 'sentAt' | 'createdAt'> {
  sentAt?: number;
  createdAt: number;
}

export interface PendingAction {
  id?: string;
  type: 'intake-create' | 'intake-update' | 'medication-create' | 'medication-update' | 'medication-delete';
  payload: any;
  timestamp: number;
  retryCount: number;
}

export class MediCareDatabase extends Dexie {
  users!: Table<DatabaseUser>;
  medications!: Table<DatabaseMedication>;
  intakeRecords!: Table<DatabaseIntakeRecord>;
  caregivers!: Table<DatabaseCaregiver>;
  accessCodes!: Table<DatabaseAccessCode>;
  caregiverActivities!: Table<DatabaseCaregiverActivity>;
  caregiverNotifications!: Table<DatabaseCaregiverNotification>;
  caregiverNotificationDeliveries!: Table<DatabaseCaregiverNotificationDelivery>;
  pendingActions!: Table<PendingAction>;

  constructor() {
    super('MediCareDB');
    
    // Version 4: Add pending actions for offline sync
    this.version(4).stores({
      users: 'id, name, age',
      medications: 'id, userId, name, isActive, startDate, endDate',
      intakeRecords: 'id, medicationId, userId, scheduledTime, status, createdAt',
      caregivers: 'id, patientId, email, isActive, createdAt',
      accessCodes: 'id, code, patientId, expiresAt, isUsed',
      caregiverActivities: 'id, caregiverId, patientId, timestamp',
      caregiverNotifications: 'id, caregiverId, patientId, type, isRead, isSent, createdAt',
      caregiverNotificationDeliveries: 'id, notificationId, caregiverId, deliveryMethod, status, createdAt',
      pendingActions: '++id, type, timestamp, retryCount'
    });
    
    // Version 3: Add caregiver notification tables
    this.version(3).stores({
      users: 'id, name, age',
      medications: 'id, userId, name, isActive, startDate, endDate',
      intakeRecords: 'id, medicationId, userId, scheduledTime, status, createdAt',
      caregivers: 'id, patientId, email, isActive, createdAt',
      accessCodes: 'id, code, patientId, expiresAt, isUsed',
      caregiverActivities: 'id, caregiverId, patientId, timestamp',
      caregiverNotifications: 'id, caregiverId, patientId, type, isRead, isSent, createdAt',
      caregiverNotificationDeliveries: 'id, notificationId, caregiverId, deliveryMethod, status, createdAt'
    });
    
    this.version(2).stores({
      users: 'id, name, age',
      medications: 'id, userId, name, isActive, startDate, endDate',
      intakeRecords: 'id, medicationId, userId, scheduledTime, status, createdAt',
      caregivers: 'id, patientId, email, isActive, createdAt',
      accessCodes: 'id, code, patientId, expiresAt, isUsed',
      caregiverActivities: 'id, caregiverId, patientId, timestamp'
    });

    // Add hooks for automatic timestamp management
    this.users.hook('creating', (_primKey, obj) => {
      const now = Date.now();
      obj.createdAt = now;
      obj.updatedAt = now;
    });

    this.users.hook('updating', (modifications) => {
      (modifications as any).updatedAt = Date.now();
    });

    this.medications.hook('creating', (_primKey, obj) => {
      const now = Date.now();
      obj.createdAt = now;
      obj.updatedAt = now;
    });

    this.medications.hook('updating', (modifications) => {
      (modifications as any).updatedAt = Date.now();
    });

    this.intakeRecords.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
    });

    this.caregivers.hook('creating', (_primKey, obj) => {
      const now = Date.now();
      obj.createdAt = now;
      obj.updatedAt = now;
    });

    this.caregivers.hook('updating', (modifications) => {
      (modifications as any).updatedAt = Date.now();
    });

    this.accessCodes.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
    });

    this.caregiverActivities.hook('creating', (_primKey, obj) => {
      obj.timestamp = Date.now();
    });

    this.caregiverNotifications.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
    });

    this.caregiverNotificationDeliveries.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
    });
  }
}

export const db = new MediCareDatabase();