import { User, Medication, IntakeRecord, UserPreferences } from '@/types';

// Test data factories
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-1',
  name: 'John Doe',
  age: 65,
  preferences: createTestUserPreferences(),
  caregivers: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  voiceEnabled: true,
  language: 'en',
  notificationSound: 'default',
  accessibilityMode: false,
  highContrast: false,
  fontSize: 'normal',
  ...overrides,
});

export const createTestMedication = (overrides: Partial<Medication> = {}): Medication => ({
  id: 'test-med-1',
  userId: 'test-user-1',
  name: 'Metformin',
  dosage: '500mg',
  form: 'tablet',
  scheduleType: 'time-based',
  times: ['08:00', '20:00'],
  instructions: 'Take with food',
  startDate: new Date('2024-01-01'),
  refillReminder: 7,
  totalPills: 60,
  remainingPills: 30,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestIntakeRecord = (overrides: Partial<IntakeRecord> = {}): IntakeRecord => ({
  id: 'test-intake-1',
  medicationId: 'test-med-1',
  userId: 'test-user-1',
  scheduledTime: new Date('2024-01-01T08:00:00'),
  status: 'taken',
  snoozeCount: 0,
  confirmedBy: 'patient',
  createdAt: new Date('2024-01-01T08:05:00'),
  ...overrides,
});

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create date ranges
export const createDateRange = (daysBack: number) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  return { startDate, endDate };
};