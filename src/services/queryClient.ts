import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes for most data
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for critical data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default (offline-first approach)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  users: {
    all: ['users'] as const,
    current: ['users', 'current'] as const,
    byId: (id: string) => ['users', id] as const,
  },
  medications: {
    all: ['medications'] as const,
    byUserId: (userId: string) => ['medications', 'user', userId] as const,
    active: (userId: string) => ['medications', 'active', userId] as const,
    byId: (id: string) => ['medications', id] as const,
    refillDue: (userId: string) => ['medications', 'refill-due', userId] as const,
  },
  intakeRecords: {
    all: ['intake-records'] as const,
    byUserId: (userId: string) => ['intake-records', 'user', userId] as const,
    byMedicationId: (medicationId: string) => ['intake-records', 'medication', medicationId] as const,
    today: (userId: string) => ['intake-records', 'today', userId] as const,
    dateRange: (userId: string, startDate: string, endDate: string) => 
      ['intake-records', 'range', userId, startDate, endDate] as const,
    adherence: (userId: string, days: number) => 
      ['intake-records', 'adherence', userId, days] as const,
    streak: (userId: string) => ['intake-records', 'streak', userId] as const,
    statistics: (userId: string, days: number) => 
      ['intake-records', 'statistics', userId, days] as const,
    history: (userId: string, limit: number) => 
      ['intake-records', 'history', userId, limit] as const,
  },
} as const;