import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntakeRepository } from '../intakeRepository';
import { createTestIntakeRecord } from '@/test/testUtils';
import { IntakeRecord } from '@/types';

// Mock the database
vi.mock('../database', () => ({
  db: {
    intakeRecords: {
      add: vi.fn(),
      get: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            sortBy: vi.fn().mockResolvedValue([]),
          })),
          reverse: vi.fn(() => ({
            sortBy: vi.fn().mockResolvedValue([]),
          })),
          sortBy: vi.fn().mockResolvedValue([]),
        })),
        reverse: vi.fn(() => ({
          sortBy: vi.fn().mockResolvedValue([]),
        })),
        sortBy: vi.fn().mockResolvedValue([]),
      })),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 15),
  },
});

describe('IntakeRepository', () => {
  let repository: IntakeRepository;
  let testRecord: IntakeRecord;
  let testUserId: string;
  let testMedicationId: string;
  let mockDb: any;

  beforeEach(async () => {
    // Get the mocked db
    const { db } = await import('../database');
    mockDb = db;
    
    repository = new IntakeRepository();
    testUserId = 'test-user-1';
    testMedicationId = 'test-med-1';
    testRecord = createTestIntakeRecord({
      userId: testUserId,
      medicationId: testMedicationId,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new intake record', async () => {
      const recordData = {
        medicationId: testMedicationId,
        userId: testUserId,
        scheduledTime: new Date('2024-01-01T08:00:00'),
        status: 'taken' as const,
        snoozeCount: 0,
        confirmedBy: 'patient' as const,
      };

      const mockDbRecord = {
        id: 'test-uuid-123',
        ...recordData,
        scheduledTime: recordData.scheduledTime.getTime(),
        createdAt: Date.now(),
      };

      mockDb.intakeRecords.add.mockResolvedValue(undefined);
      mockDb.intakeRecords.get.mockResolvedValue(mockDbRecord);

      const result = await repository.create(recordData);

      expect(mockDb.intakeRecords.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          medicationId: testMedicationId,
          userId: testUserId,
          status: 'taken',
          scheduledTime: recordData.scheduledTime.getTime(),
          createdAt: expect.any(Number),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'test-uuid-123',
          medicationId: testMedicationId,
          userId: testUserId,
          status: 'taken',
          scheduledTime: recordData.scheduledTime,
          createdAt: expect.any(Date),
        })
      );
    });

    it('should throw error if creation fails', async () => {
      mockDb.intakeRecords.add.mockResolvedValue(undefined);
      mockDb.intakeRecords.get.mockResolvedValue(null);

      const recordData = {
        medicationId: testMedicationId,
        userId: testUserId,
        scheduledTime: new Date(),
        status: 'taken' as const,
        snoozeCount: 0,
        confirmedBy: 'patient' as const,
      };

      await expect(repository.create(recordData)).rejects.toThrow('Failed to create intake record');
    });
  });

  describe('getById', () => {
    it('should return intake record by id', async () => {
      const mockDbRecord = {
        id: testRecord.id,
        medicationId: testRecord.medicationId,
        userId: testRecord.userId,
        scheduledTime: testRecord.scheduledTime.getTime(),
        actualTime: testRecord.actualTime?.getTime(),
        status: testRecord.status,
        snoozeCount: testRecord.snoozeCount,
        confirmedBy: testRecord.confirmedBy,
        createdAt: testRecord.createdAt.getTime(),
      };

      mockDb.intakeRecords.get.mockResolvedValue(mockDbRecord);

      const result = await repository.getById(testRecord.id);

      expect(mockDb.intakeRecords.get).toHaveBeenCalledWith(testRecord.id);
      expect(result).toEqual(testRecord);
    });

    it('should return null if record not found', async () => {
      mockDb.intakeRecords.get.mockResolvedValue(null);

      const result = await repository.getById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('calculateAdherenceRate', () => {
    it('should calculate adherence rate correctly', async () => {
      const mockRecords = [
        createTestIntakeRecord({ status: 'taken' }),
        createTestIntakeRecord({ status: 'taken' }),
        createTestIntakeRecord({ status: 'missed' }),
        createTestIntakeRecord({ status: 'skipped' }),
        createTestIntakeRecord({ status: 'taken' }),
      ];

      // Mock the getByDateRange method
      vi.spyOn(repository, 'getByDateRange').mockResolvedValue(mockRecords);

      const result = await repository.calculateAdherenceRate(testUserId, 30);

      // 3 taken out of 5 total = 60%
      expect(result).toBe(60);
    });

    it('should return 0 for no records', async () => {
      vi.spyOn(repository, 'getByDateRange').mockResolvedValue([]);

      const result = await repository.calculateAdherenceRate(testUserId, 30);

      expect(result).toBe(0);
    });

    it('should handle 100% adherence', async () => {
      const mockRecords = [
        createTestIntakeRecord({ status: 'taken' }),
        createTestIntakeRecord({ status: 'taken' }),
        createTestIntakeRecord({ status: 'taken' }),
      ];

      vi.spyOn(repository, 'getByDateRange').mockResolvedValue(mockRecords);

      const result = await repository.calculateAdherenceRate(testUserId, 30);

      expect(result).toBe(100);
    });
  });

  describe('getStreakData', () => {
    it('should calculate current streak correctly', async () => {
      // Create records for the last 10 days with varying adherence
      const mockRecords: IntakeRecord[] = [];
      const today = new Date();
      
      // Last 5 days: perfect adherence (current streak = 5)
      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        mockRecords.push(
          createTestIntakeRecord({
            scheduledTime: new Date(date.setHours(8, 0, 0, 0)),
            status: 'taken',
          }),
          createTestIntakeRecord({
            scheduledTime: new Date(date.setHours(20, 0, 0, 0)),
            status: 'taken',
          })
        );
      }

      // Day 6: missed one dose (breaks streak)
      const day6 = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
      mockRecords.push(
        createTestIntakeRecord({
          scheduledTime: new Date(day6.setHours(8, 0, 0, 0)),
          status: 'taken',
        }),
        createTestIntakeRecord({
          scheduledTime: new Date(day6.setHours(20, 0, 0, 0)),
          status: 'missed',
        })
      );

      // Days 7-10: perfect adherence (longest streak = 4)
      for (let i = 6; i < 10; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        mockRecords.push(
          createTestIntakeRecord({
            scheduledTime: new Date(date.setHours(8, 0, 0, 0)),
            status: 'taken',
          }),
          createTestIntakeRecord({
            scheduledTime: new Date(date.setHours(20, 0, 0, 0)),
            status: 'taken',
          })
        );
      }

      vi.spyOn(repository, 'getByDateRange').mockResolvedValue(mockRecords);

      const result = await repository.getStreakData(testUserId);

      expect(result).toEqual({
        currentStreak: 5,
        longestStreak: 5, // The current streak is also the longest in this dataset
        streakType: 'daily',
      });
    });

    it('should handle zero current streak', async () => {
      const today = new Date();
      const mockRecords = [
        createTestIntakeRecord({
          scheduledTime: new Date(today.setHours(8, 0, 0, 0)),
          status: 'missed',
        }),
      ];

      vi.spyOn(repository, 'getByDateRange').mockResolvedValue(mockRecords);

      const result = await repository.getStreakData(testUserId);

      expect(result.currentStreak).toBe(0);
    });

    it('should calculate longest streak correctly', async () => {
      const today = new Date();
      const mockRecords: IntakeRecord[] = [];

      // Create a pattern: 3 good days, 1 bad day, 5 good days, 1 bad day, 2 good days
      const pattern = [
        { days: 3, adherent: true },   // Streak of 3
        { days: 1, adherent: false },  // Break
        { days: 5, adherent: true },   // Streak of 5 (longest)
        { days: 1, adherent: false },  // Break
        { days: 2, adherent: true },   // Current streak of 2
      ];

      let dayOffset = 0;
      pattern.forEach(({ days, adherent }) => {
        for (let i = 0; i < days; i++) {
          const date = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000);
          mockRecords.push(
            createTestIntakeRecord({
              scheduledTime: new Date(date.setHours(8, 0, 0, 0)),
              status: adherent ? 'taken' : 'missed',
            })
          );
          dayOffset++;
        }
      });

      vi.spyOn(repository, 'getByDateRange').mockResolvedValue(mockRecords.reverse());

      const result = await repository.getStreakData(testUserId);

      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(5);
    });
  });

  describe('getAdherenceStatistics', () => {
    it('should calculate comprehensive adherence statistics', async () => {
      const mockRecords = [
        // Taken on time (within 30 minutes)
        createTestIntakeRecord({
          scheduledTime: new Date('2024-01-01T08:00:00'),
          actualTime: new Date('2024-01-01T08:15:00'),
          status: 'taken',
        }),
        // Taken late (more than 30 minutes)
        createTestIntakeRecord({
          scheduledTime: new Date('2024-01-01T20:00:00'),
          actualTime: new Date('2024-01-01T20:45:00'),
          status: 'taken',
        }),
        // Missed dose
        createTestIntakeRecord({
          scheduledTime: new Date('2024-01-02T08:00:00'),
          status: 'missed',
        }),
        // Skipped dose
        createTestIntakeRecord({
          scheduledTime: new Date('2024-01-02T20:00:00'),
          status: 'skipped',
          skipReason: 'Side effects',
        }),
        // Another taken on time
        createTestIntakeRecord({
          scheduledTime: new Date('2024-01-03T08:00:00'),
          actualTime: new Date('2024-01-03T08:05:00'),
          status: 'taken',
        }),
      ];

      vi.spyOn(repository, 'getByDateRange').mockResolvedValue(mockRecords);

      const result = await repository.getAdherenceStatistics(testUserId, 30);

      expect(result).toEqual({
        adherenceRate: 60, // 3 taken out of 5 total = 60%
        totalDoses: 5,
        takenDoses: 3,
        missedDoses: 1,
        skippedDoses: 1,
        onTimeRate: expect.closeTo(66.67, 1), // 2 on-time out of 3 taken ≈ 66.67%
      });
    });

    it('should handle empty records', async () => {
      vi.spyOn(repository, 'getByDateRange').mockResolvedValue([]);

      const result = await repository.getAdherenceStatistics(testUserId, 30);

      expect(result).toEqual({
        adherenceRate: 0,
        totalDoses: 0,
        takenDoses: 0,
        missedDoses: 0,
        skippedDoses: 0,
        onTimeRate: 0,
      });
    });

    it('should calculate on-time rate correctly', async () => {
      const mockRecords = [
        // Exactly 30 minutes late (should be considered on-time)
        createTestIntakeRecord({
          scheduledTime: new Date('2024-01-01T08:00:00'),
          actualTime: new Date('2024-01-01T08:30:00'),
          status: 'taken',
        }),
        // 31 minutes late (should be considered late)
        createTestIntakeRecord({
          scheduledTime: new Date('2024-01-01T20:00:00'),
          actualTime: new Date('2024-01-01T20:31:00'),
          status: 'taken',
        }),
        // 15 minutes early (should be considered on-time)
        createTestIntakeRecord({
          scheduledTime: new Date('2024-01-02T08:00:00'),
          actualTime: new Date('2024-01-02T07:45:00'),
          status: 'taken',
        }),
      ];

      vi.spyOn(repository, 'getByDateRange').mockResolvedValue(mockRecords);

      const result = await repository.getAdherenceStatistics(testUserId, 30);

      expect(result.onTimeRate).toBeCloseTo(66.67, 1); // 2 on-time out of 3 taken
    });
  });

  describe('markAsTaken', () => {
    it('should mark dose as taken with current time', async () => {
      const updatedRecord = { ...testRecord, status: 'taken' as const, actualTime: new Date() };
      
      vi.spyOn(repository, 'update').mockResolvedValue(updatedRecord);

      const result = await repository.markAsTaken(testRecord.id);

      expect(repository.update).toHaveBeenCalledWith(testRecord.id, {
        status: 'taken',
        actualTime: expect.any(Date),
      });
      expect(result).toEqual(updatedRecord);
    });

    it('should mark dose as taken with specific time', async () => {
      const specificTime = new Date('2024-01-01T10:00:00');
      const updatedRecord = { ...testRecord, status: 'taken' as const, actualTime: specificTime };
      
      vi.spyOn(repository, 'update').mockResolvedValue(updatedRecord);

      const result = await repository.markAsTaken(testRecord.id, specificTime);

      expect(repository.update).toHaveBeenCalledWith(testRecord.id, {
        status: 'taken',
        actualTime: specificTime,
      });
      expect(result).toEqual(updatedRecord);
    });
  });

  describe('markAsSkipped', () => {
    it('should mark dose as skipped with reason', async () => {
      const reason = 'Side effects';
      const updatedRecord = { ...testRecord, status: 'skipped' as const, skipReason: reason };
      
      vi.spyOn(repository, 'update').mockResolvedValue(updatedRecord);

      const result = await repository.markAsSkipped(testRecord.id, reason);

      expect(repository.update).toHaveBeenCalledWith(testRecord.id, {
        status: 'skipped',
        skipReason: reason,
      });
      expect(result).toEqual(updatedRecord);
    });

    it('should mark dose as skipped without reason', async () => {
      const updatedRecord = { ...testRecord, status: 'skipped' as const };
      
      vi.spyOn(repository, 'update').mockResolvedValue(updatedRecord);

      const result = await repository.markAsSkipped(testRecord.id);

      expect(repository.update).toHaveBeenCalledWith(testRecord.id, {
        status: 'skipped',
        skipReason: undefined,
      });
      expect(result).toEqual(updatedRecord);
    });
  });

  describe('markAsMissed', () => {
    it('should mark dose as missed', async () => {
      const updatedRecord = { ...testRecord, status: 'missed' as const };
      
      vi.spyOn(repository, 'update').mockResolvedValue(updatedRecord);

      const result = await repository.markAsMissed(testRecord.id);

      expect(repository.update).toHaveBeenCalledWith(testRecord.id, {
        status: 'missed',
      });
      expect(result).toEqual(updatedRecord);
    });
  });

  describe('getIntakeHistory', () => {
    it('should return limited intake history', async () => {
      const mockRecords = Array.from({ length: 100 }, (_, i) =>
        createTestIntakeRecord({ id: `record-${i}` })
      );

      // Mock the database query chain
      const mockSortBy = vi.fn().mockResolvedValue(mockRecords);
      const mockReverse = vi.fn(() => ({ sortBy: mockSortBy }));
      const mockWhere = vi.fn(() => ({ reverse: mockReverse }));
      
      mockDb.intakeRecords.where.mockReturnValue(mockWhere());

      const result = await repository.getIntakeHistory(testUserId, 50);

      expect(result).toHaveLength(50);
      expect(mockDb.intakeRecords.where).toHaveBeenCalledWith('userId');
    });
  });

  describe('date conversion helpers', () => {
    it('should convert database record to domain record correctly', async () => {
      const dbRecord = {
        id: 'test-id',
        medicationId: 'med-id',
        userId: 'user-id',
        scheduledTime: new Date('2024-01-01T08:00:00').getTime(),
        actualTime: new Date('2024-01-01T08:05:00').getTime(),
        status: 'taken' as const,
        snoozeCount: 1,
        confirmedBy: 'patient' as const,
        createdAt: new Date('2024-01-01T08:05:00').getTime(),
      };

      mockDb.intakeRecords.get.mockResolvedValue(dbRecord);

      const result = await repository.getById('test-id');

      expect(result).toEqual({
        id: 'test-id',
        medicationId: 'med-id',
        userId: 'user-id',
        scheduledTime: new Date('2024-01-01T08:00:00'),
        actualTime: new Date('2024-01-01T08:05:00'),
        status: 'taken',
        snoozeCount: 1,
        confirmedBy: 'patient',
        createdAt: new Date('2024-01-01T08:05:00'),
      });
    });

    it('should handle records without actualTime', async () => {
      const dbRecord = {
        id: 'test-id',
        medicationId: 'med-id',
        userId: 'user-id',
        scheduledTime: new Date('2024-01-01T08:00:00').getTime(),
        actualTime: undefined,
        status: 'missed' as const,
        snoozeCount: 0,
        confirmedBy: 'patient' as const,
        createdAt: new Date('2024-01-01T08:05:00').getTime(),
      };

      mockDb.intakeRecords.get.mockResolvedValue(dbRecord);

      const result = await repository.getById('test-id');

      expect(result?.actualTime).toBeUndefined();
    });
  });
});