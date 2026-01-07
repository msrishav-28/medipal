import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicationRepository } from "@/services/medicationRepository";
import { Medication } from "@/types";

export const MEDICATION_KEYS = {
  all: ["medications"] as const,
  lists: () => [...MEDICATION_KEYS.all, "list"] as const,
  list: (userId: string) => [...MEDICATION_KEYS.lists(), userId] as const,
  details: () => [...MEDICATION_KEYS.all, "detail"] as const,
  detail: (id: string) => [...MEDICATION_KEYS.details(), id] as const,
};

export function useMedications(userId: string) {
  return useQuery({
    queryKey: MEDICATION_KEYS.list(userId),
    queryFn: () => medicationRepository.getByUserId(userId),
  });
}

export function useActiveMedications(userId: string) {
  return useQuery({
    queryKey: [...MEDICATION_KEYS.list(userId), "active"],
    queryFn: () => medicationRepository.getActiveMedications(userId),
  });
}

export function useMedication(id: string) {
  return useQuery({
    queryKey: MEDICATION_KEYS.detail(id),
    queryFn: () => medicationRepository.getById(id),
    enabled: !!id,
  });
}

export function useAddMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newMedication: Omit<Medication, "id" | "createdAt" | "updatedAt">) =>
      medicationRepository.create(newMedication),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICATION_KEYS.lists() });
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Medication, "id" | "createdAt" | "updatedAt">>;
    }) => medicationRepository.update(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: MEDICATION_KEYS.lists() });
        queryClient.invalidateQueries({ queryKey: MEDICATION_KEYS.detail(data.id) });
      }
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => medicationRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICATION_KEYS.lists() });
    },
  });
}