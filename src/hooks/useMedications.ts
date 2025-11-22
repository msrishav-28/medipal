import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationRepository } from '@/services';
import { queryKeys } from '@/services/queryClient';
import { Medication } from '@/types';

// Hook for getting all medications for a user
export function useMedications(userId: string) {
  return useQuery({
    queryKey: queryKeys.medications.byUserId(userId),
    queryFn: () => medicationRepository.getByUserId(userId),
    enabled: !!userId,
  });
}

// Hook for getting active medications for a user
export function useActiveMedications(userId: string) {
  return useQuery({
    queryKey: queryKeys.medications.active(userId),
    queryFn: () => medicationRepository.getActiveMedications(userId),
    enabled: !!userId,
  });
}

// Hook for getting a single medication by ID
export function useMedication(id: string) {
  return useQuery({
    queryKey: queryKeys.medications.byId(id),
    queryFn: () => medicationRepository.getById(id),
    enabled: !!id,
  });
}

// Hook for getting medications due for refill
export function useMedicationsRefillDue(userId: string, daysAhead: number = 7) {
  return useQuery({
    queryKey: queryKeys.medications.refillDue(userId),
    queryFn: () => medicationRepository.getMedicationsDueForRefill(userId, daysAhead),
    enabled: !!userId,
  });
}

// Hook for creating a new medication
export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) =>
      medicationRepository.create(medicationData),
    onSuccess: (newMedication) => {
      // Invalidate and refetch medication queries for this user
      queryClient.invalidateQueries({
        queryKey: queryKeys.medications.byUserId(newMedication.userId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.medications.active(newMedication.userId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.medications.refillDue(newMedication.userId)
      });

      // Add the new medication to the cache
      queryClient.setQueryData(
        queryKeys.medications.byId(newMedication.id),
        newMedication
      );
    },
  });
}

// Hook for updating a medication
export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: Partial<Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>> 
    }) => medicationRepository.update(id, updates),
    onSuccess: (updatedMedication, { id }) => {
      if (updatedMedication) {
        // Update the specific medication in cache
        queryClient.setQueryData(
          queryKeys.medications.byId(id),
          updatedMedication
        );

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.medications.byUserId(updatedMedication.userId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.medications.active(updatedMedication.userId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.medications.refillDue(updatedMedication.userId)
        });
      }
    },
  });
}

// Hook for deleting a medication
export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => medicationRepository.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.medications.byId(id)
      });

      // Invalidate all medication lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.medications.all
      });
    },
  });
}

// Hook for deactivating a medication
export function useDeactivateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => medicationRepository.deactivate(id),
    onSuccess: (updatedMedication, id) => {
      if (updatedMedication) {
        // Update the specific medication in cache
        queryClient.setQueryData(
          queryKeys.medications.byId(id),
          updatedMedication
        );

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.medications.byUserId(updatedMedication.userId)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.medications.active(updatedMedication.userId)
        });
      }
    },
  });
}