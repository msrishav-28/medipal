import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intakeRepository } from '@/services';
import { queryKeys } from '@/services/queryClient';
import { IntakeRecord } from '@/types';

// Hook for getting intake records by user ID
export function useIntakeRecords(userId: string) {
  return useQuery({
    queryKey: queryKeys.intakeRecords.byUserId(userId),
    queryFn: () => intakeRepository.getByUserId(userId),
    enabled: !!userId,
  });
}

// Hook for getting intake records by medication ID
export function useIntakeRecordsByMedication(medicationId: string) {
  return useQuery({
    queryKey: queryKeys.intakeRecords.byMedicationId(medicationId),
    queryFn: () => intakeRepository.getByMedicationId(medicationId),
    enabled: !!medicationId,
  });
}

// Hook for getting today's intake records
export function useTodaysIntakeRecords(userId: string) {
  return useQuery({
    queryKey: queryKeys.intakeRecords.today(userId),
    queryFn: () => intakeRepository.getTodaysRecords(userId),
    enabled: !!userId,
    // Refetch more frequently for today's data
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for getting intake records by date range
export function useIntakeRecordsByDateRange(
  userId: string, 
  startDate: Date, 
  endDate: Date
) {
  return useQuery({
    queryKey: queryKeys.intakeRecords.dateRange(
      userId, 
      startDate.toISOString(), 
      endDate.toISOString()
    ),
    queryFn: () => intakeRepository.getByDateRange(userId, startDate, endDate),
    enabled: !!userId && !!startDate && !!endDate,
  });
}

// Hook for calculating adherence rate
export function useAdherenceRate(userId: string, days: number = 30) {
  return useQuery({
    queryKey: queryKeys.intakeRecords.adherence(userId, days),
    queryFn: () => intakeRepository.calculateAdherenceRate(userId, days),
    enabled: !!userId,
    // Cache adherence data for longer since it doesn't change frequently
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for creating a new intake record
export function useCreateIntakeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordData: Omit<IntakeRecord, 'id' | 'createdAt'>) =>
      intakeRepository.create(recordData),
    onSuccess: (newRecord) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.intakeRecords.byUserId(newRecord.userId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.intakeRecords.byMedicationId(newRecord.medicationId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.intakeRecords.today(newRecord.userId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.intakeRecords.adherence(newRecord.userId, 30)
      });
    },
  });
}

// Hook for updating an intake record
export function useUpdateIntakeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: Partial<Omit<IntakeRecord, 'id' | 'createdAt'>> 
    }) => intakeRepository.update(id, updates),
    onSuccess: (updatedRecord) => {
      if (updatedRecord) {
        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.byUserId(updatedRecord.userId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.byMedicationId(updatedRecord.medicationId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.today(updatedRecord.userId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.adherence(updatedRecord.userId, 30)
        });
      }
    },
  });
}

// Hook for marking a dose as taken
export function useMarkDoseAsTaken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, actualTime }: { id: string; actualTime?: Date }) =>
      intakeRepository.markAsTaken(id, actualTime),
    onSuccess: (updatedRecord) => {
      if (updatedRecord) {
        // Optimistically update the cache
        queryClient.setQueryData(
          queryKeys.intakeRecords.byUserId(updatedRecord.userId),
          (oldData: IntakeRecord[] | undefined) => {
            if (!oldData) return [updatedRecord];
            return oldData.map(record => 
              record.id === updatedRecord.id ? updatedRecord : record
            );
          }
        );

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.today(updatedRecord.userId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.adherence(updatedRecord.userId, 30)
        });
      }
    },
  });
}

// Hook for marking a dose as skipped
export function useMarkDoseAsSkipped() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      intakeRepository.markAsSkipped(id, reason),
    onSuccess: (updatedRecord) => {
      if (updatedRecord) {
        // Optimistically update the cache
        queryClient.setQueryData(
          queryKeys.intakeRecords.byUserId(updatedRecord.userId),
          (oldData: IntakeRecord[] | undefined) => {
            if (!oldData) return [updatedRecord];
            return oldData.map(record => 
              record.id === updatedRecord.id ? updatedRecord : record
            );
          }
        );

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.today(updatedRecord.userId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.adherence(updatedRecord.userId, 30)
        });
      }
    },
  });
}

// Hook for marking a dose as missed
export function useMarkDoseAsMissed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => intakeRepository.markAsMissed(id),
    onSuccess: (updatedRecord) => {
      if (updatedRecord) {
        // Optimistically update the cache
        queryClient.setQueryData(
          queryKeys.intakeRecords.byUserId(updatedRecord.userId),
          (oldData: IntakeRecord[] | undefined) => {
            if (!oldData) return [updatedRecord];
            return oldData.map(record => 
              record.id === updatedRecord.id ? updatedRecord : record
            );
          }
        );

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.today(updatedRecord.userId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.intakeRecords.adherence(updatedRecord.userId, 30)
        });
      }
    },
  });
}

// Hook for getting streak data
export function useStreakData(userId: string) {
  return useQuery({
    queryKey: queryKeys.intakeRecords.streak(userId),
    queryFn: () => intakeRepository.getStreakData(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for getting detailed adherence statistics
export function useAdherenceStatistics(userId: string, days: number = 30) {
  return useQuery({
    queryKey: queryKeys.intakeRecords.statistics(userId, days),
    queryFn: () => intakeRepository.getAdherenceStatistics(userId, days),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for getting intake history
export function useIntakeHistory(userId: string, limit: number = 50) {
  return useQuery({
    queryKey: queryKeys.intakeRecords.history(userId, limit),
    queryFn: () => intakeRepository.getIntakeHistory(userId, limit),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}