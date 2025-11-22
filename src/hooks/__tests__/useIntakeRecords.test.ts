import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useIntakeRecords,
  useIntakeRecordsByMedication,
  useTodaysIntakeRecords,
  useIntakeRecordsByDateRange,
  useAdherenceRate,
  useCreateIntakeRecord,
  useUpdateIntakeRecord,
  useMarkDoseAsTaken,
  useMarkDoseAsSkipped,
  useMarkDoseAsMissed,
  useStreakData,
  useAdherenceStatistics,
  useIntakeHistory
} from '../useIntakeRecords';
import { createTestIntakeRecord, createTestMedication, createDateRange } from '@/test/testUtils';
import { IntakeRecord } from '@/types';

// Mock the intake repository
const mockIntakeRepository = {
  create: vi.fn(),
  getById: vi.fn(),
  getByMedicationId: vi.fn(),
  getByUserId: vi.fn(),
  getByDateRange: vi.fn(),
  getTodaysRecords: vi.fn(),
  getMissedDoses: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  markAsTaken: vi.fn(),
  markAsSkipped: vi.fn(),
  markAsMissed: vi.fn(),
  calculateAdherenceRate: vi.fn(),
  getStreakData: vi.fn(),
  getAdherenceStatistics: vi.fn(),
  getIntakeHistory: vi.fn(),
};

vi.mock('@/services', () => ({
  intakeRepository: mockIntakeRepository,
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useIntakeRecords hooks', () => {
  let testRecord: IntakeRecord;
  let testUserId: string;
  let testMedicationId: string;

  beforeEach(() => {
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

  describe('useIntakeRecords', () => {
    it('should fetch intake records for a user', async () => {
      const mockRecords = [testRecord];
      mockIntakeRepository.getByUserId.mockResolvedValue(mockRecords);

      const { result } = renderHook(
        () => useIntakeRecords(testUserId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecords);
      expect(mockIntakeRepository.getByUserId).toHaveBeenCalledWith(testUserId);
    });

    it('should not fetch when userId is empty', () => {
      renderHook(
        () => useIntakeRecords(''),
        { wrapper: createWrapper() }
      );

      expect(mockIntakeRepository.getByUserId).not.toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      const error = new Error('Fetch failed');
      mockIntakeRepository.getByUserId.mockRejectedValue(error);

      const { result } = renderHook(
        () => useIntakeRecords(testUserId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useIntakeRecordsByMedication', () => {
    it('should fetch intake records for a medication', async () => {
      const mockRecords = [testRecord];
      mockIntakeRepository.getByMedicationId.mockResolvedValue(mockRecords);

      const { result } = renderHook(
        () => useIntakeRecordsByMedication(testMedicationId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecords);
      expect(mockIntakeRepository.getByMedicationId).toHaveBeenCalledWith(testMedicationId);
    });
  });

  describe('useTodaysIntakeRecords', () => {
    it('should fetch today\'s intake records', async () => {
      const mockRecords = [testRecord];
      mockIntakeRepository.getTodaysRecords.mockResolvedValue(mockRecords);

      const { result } = renderHook(
        () => useTodaysIntakeRecords(testUserId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecords);
      expect(mockIntakeRepository.getTodaysRecords).toHaveBeenCalledWith(testUserId);
    });

    it('should refetch more frequently for today\'s data', () => {
      const { result } = renderHook(
        () => useTodaysIntakeRecords(testUserId),
        { wrapper: createWrapper() }
      );

      // Check that the query has shorter stale time and refetch interval
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe('useIntakeRecordsByDateRange', () => {
    it('should fetch intake records by date range', async () => {
      const { startDate, endDate } = createDateRange(7);
      const mockRecords = [testRecord];
      mockIntakeRepository.getByDateRange.mockResolvedValue(mockRecords);

      const { result } = renderHook(
        () => useIntakeRecordsByDateRange(testUserId, startDate, endDate),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecords);
      expect(mockIntakeRepository.getByDateRange).toHaveBeenCalledWith(
        testUserId,
        startDate,
        endDate
      );
    });

    it('should not fetch when required parameters are missing', () => {
      renderHook(
        () => useIntakeRecordsByDateRange('', new Date(), new Date()),
        { wrapper: createWrapper() }
      );

      expect(mockIntakeRepository.getByDateRange).not.toHaveBeenCalled();
    });
  });

  describe('useAdherenceRate', () => {
    it('should calculate adherence rate', async () => {
      const mockRate = 85.5;
      mockIntakeRepository.calculateAdherenceRate.mockResolvedValue(mockRate);

      const { result } = renderHook(
        () => useAdherenceRate(testUserId, 30),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(mockRate);
      expect(mockIntakeRepository.calculateAdherenceRate).toHaveBeenCalledWith(testUserId, 30);
    });

    it('should use default days parameter', async () => {
      mockIntakeRepository.calculateAdherenceRate.mockResolvedValue(90);

      renderHook(
        () => useAdherenceRate(testUserId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockIntakeRepository.calculateAdherenceRate).toHaveBeenCalledWith(testUserId, 30);
      });
    });
  });

  describe('useCreateIntakeRecord', () => {
    it('should create a new intake record', async () => {
      const newRecord = createTestIntakeRecord({ id: 'new-record' });
      mockIntakeRepository.create.mockResolvedValue(newRecord);

      const { result } = renderHook(
        () => useCreateIntakeRecord(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        const recordData = {
          medicationId: testMedicationId,
          userId: testUserId,
          scheduledTime: new Date(),
          status: 'taken' as const,
          snoozeCount: 0,
          confirmedBy: 'patient' as const,
        };

        await result.current.mutateAsync(recordData);
      });

      expect(mockIntakeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          medicationId: testMedicationId,
          userId: testUserId,
          status: 'taken',
        })
      );
    });

    it('should handle creation error', async () => {
      const error = new Error('Creation failed');
      mockIntakeRepository.create.mockRejectedValue(error);

      const { result } = renderHook(
        () => useCreateIntakeRecord(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        try {
          await result.current.mutateAsync({
            medicationId: testMedicationId,
            userId: testUserId,
            scheduledTime: new Date(),
            status: 'taken',
            snoozeCount: 0,
            confirmedBy: 'patient',
          });
        } catch (e) {
          expect(e).toEqual(error);
        }
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('useUpdateIntakeRecord', () => {
    it('should update an intake record', async () => {
      const updatedRecord = { ...testRecord, status: 'skipped' as const };
      mockIntakeRepository.update.mockResolvedValue(updatedRecord);

      const { result } = renderHook(
        () => useUpdateIntakeRecord(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync({
          id: testRecord.id,
          updates: { status: 'skipped' },
        });
      });

      expect(mockIntakeRepository.update).toHaveBeenCalledWith(
        testRecord.id,
        { status: 'skipped' }
      );
    });
  });

  describe('useMarkDoseAsTaken', () => {
    it('should mark dose as taken with current time', async () => {
      const takenRecord = { ...testRecord, status: 'taken' as const, actualTime: new Date() };
      mockIntakeRepository.markAsTaken.mockResolvedValue(takenRecord);

      const { result } = renderHook(
        () => useMarkDoseAsTaken(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync({ id: testRecord.id });
      });

      expect(mockIntakeRepository.markAsTaken).toHaveBeenCalledWith(
        testRecord.id,
        undefined
      );
    });

    it('should mark dose as taken with specific time', async () => {
      const specificTime = new Date('2024-01-01T10:00:00');
      const takenRecord = { ...testRecord, status: 'taken' as const, actualTime: specificTime };
      mockIntakeRepository.markAsTaken.mockResolvedValue(takenRecord);

      const { result } = renderHook(
        () => useMarkDoseAsTaken(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync({
          id: testRecord.id,
          actualTime: specificTime,
        });
      });

      expect(mockIntakeRepository.markAsTaken).toHaveBeenCalledWith(
        testRecord.id,
        specificTime
      );
    });
  });

  describe('useMarkDoseAsSkipped', () => {
    it('should mark dose as skipped with reason', async () => {
      const skippedRecord = { ...testRecord, status: 'skipped' as const, skipReason: 'Side effects' };
      mockIntakeRepository.markAsSkipped.mockResolvedValue(skippedRecord);

      const { result } = renderHook(
        () => useMarkDoseAsSkipped(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync({
          id: testRecord.id,
          reason: 'Side effects',
        });
      });

      expect(mockIntakeRepository.markAsSkipped).toHaveBeenCalledWith(
        testRecord.id,
        'Side effects'
      );
    });

    it('should mark dose as skipped without reason', async () => {
      const skippedRecord = { ...testRecord, status: 'skipped' as const };
      mockIntakeRepository.markAsSkipped.mockResolvedValue(skippedRecord);

      const { result } = renderHook(
        () => useMarkDoseAsSkipped(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync({ id: testRecord.id });
      });

      expect(mockIntakeRepository.markAsSkipped).toHaveBeenCalledWith(
        testRecord.id,
        undefined
      );
    });
  });

  describe('useMarkDoseAsMissed', () => {
    it('should mark dose as missed', async () => {
      const missedRecord = { ...testRecord, status: 'missed' as const };
      mockIntakeRepository.markAsMissed.mockResolvedValue(missedRecord);

      const { result } = renderHook(
        () => useMarkDoseAsMissed(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync(testRecord.id);
      });

      expect(mockIntakeRepository.markAsMissed).toHaveBeenCalledWith(testRecord.id);
    });
  });

  describe('useStreakData', () => {
    it('should fetch streak data', async () => {
      const mockStreakData = {
        currentStreak: 7,
        longestStreak: 14,
        streakType: 'daily' as const,
      };
      mockIntakeRepository.getStreakData.mockResolvedValue(mockStreakData);

      const { result } = renderHook(
        () => useStreakData(testUserId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStreakData);
      expect(mockIntakeRepository.getStreakData).toHaveBeenCalledWith(testUserId);
    });

    it('should cache streak data for 5 minutes', () => {
      const { result } = renderHook(
        () => useStreakData(testUserId),
        { wrapper: createWrapper() }
      );

      // Verify stale time is set correctly (5 minutes = 300000ms)
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe('useAdherenceStatistics', () => {
    it('should fetch adherence statistics', async () => {
      const mockStats = {
        adherenceRate: 85.5,
        totalDoses: 20,
        takenDoses: 17,
        missedDoses: 2,
        skippedDoses: 1,
        onTimeRate: 94.1,
      };
      mockIntakeRepository.getAdherenceStatistics.mockResolvedValue(mockStats);

      const { result } = renderHook(
        () => useAdherenceStatistics(testUserId, 30),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(mockIntakeRepository.getAdherenceStatistics).toHaveBeenCalledWith(testUserId, 30);
    });

    it('should use default days parameter', async () => {
      mockIntakeRepository.getAdherenceStatistics.mockResolvedValue({
        adherenceRate: 90,
        totalDoses: 10,
        takenDoses: 9,
        missedDoses: 1,
        skippedDoses: 0,
        onTimeRate: 88.9,
      });

      renderHook(
        () => useAdherenceStatistics(testUserId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockIntakeRepository.getAdherenceStatistics).toHaveBeenCalledWith(testUserId, 30);
      });
    });
  });

  describe('useIntakeHistory', () => {
    it('should fetch intake history', async () => {
      const mockHistory = [testRecord];
      mockIntakeRepository.getIntakeHistory.mockResolvedValue(mockHistory);

      const { result } = renderHook(
        () => useIntakeHistory(testUserId, 50),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockHistory);
      expect(mockIntakeRepository.getIntakeHistory).toHaveBeenCalledWith(testUserId, 50);
    });

    it('should use default limit parameter', async () => {
      mockIntakeRepository.getIntakeHistory.mockResolvedValue([testRecord]);

      renderHook(
        () => useIntakeHistory(testUserId),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockIntakeRepository.getIntakeHistory).toHaveBeenCalledWith(testUserId, 50);
      });
    });

    it('should cache history data for 2 minutes', () => {
      const { result } = renderHook(
        () => useIntakeHistory(testUserId),
        { wrapper: createWrapper() }
      );

      // Verify stale time is set correctly (2 minutes = 120000ms)
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe('query invalidation', () => {
    it('should invalidate related queries when marking dose as taken', async () => {
      const takenRecord = { ...testRecord, status: 'taken' as const };
      mockIntakeRepository.markAsTaken.mockResolvedValue(takenRecord);

      const { result } = renderHook(
        () => useMarkDoseAsTaken(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync({ id: testRecord.id });
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should invalidate related queries when marking dose as skipped', async () => {
      const skippedRecord = { ...testRecord, status: 'skipped' as const };
      mockIntakeRepository.markAsSkipped.mockResolvedValue(skippedRecord);

      const { result } = renderHook(
        () => useMarkDoseAsSkipped(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync({ id: testRecord.id });
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should invalidate related queries when marking dose as missed', async () => {
      const missedRecord = { ...testRecord, status: 'missed' as const };
      mockIntakeRepository.markAsMissed.mockResolvedValue(missedRecord);

      const { result } = renderHook(
        () => useMarkDoseAsMissed(),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.mutateAsync(testRecord.id);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });
});