import { useState, useMemo } from 'react';
import { useIntakeRecordsByDateRange } from './useIntakeRecords';
import { useCurrentUser } from './useUser';

/**
 * Hook for managing calendar state and date selection
 */
export function useCalendar(initialDate?: Date) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());
  const { data: user } = useCurrentUser();

  // Calculate month boundaries
  const monthStart = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  }, [currentMonth]);

  const monthEnd = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
  }, [currentMonth]);

  // Get intake records for the current month
  const { data: records = [], isLoading } = useIntakeRecordsByDateRange(
    user?.id || '',
    monthStart,
    monthEnd
  );

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Go to a specific month
  const goToMonth = (date: Date) => {
    setCurrentMonth(date);
  };

  // Select a specific date
  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  // Clear date selection
  const clearSelection = () => {
    setSelectedDate(undefined);
  };

  return {
    selectedDate,
    currentMonth,
    monthStart,
    monthEnd,
    records,
    isLoading,
    previousMonth,
    nextMonth,
    goToToday,
    goToMonth,
    selectDate,
    clearSelection,
  };
}

/**
 * Hook for managing medication history with filtering
 */
export function useHistory(_limit: number = 100) {
  const { data: user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'taken' | 'missed' | 'skipped'>('all');
  const [medicationFilter, setMedicationFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // Calculate date range for records
  const { startDate, endDate } = useMemo(() => {
    const end = dateRange.end ? new Date(dateRange.end) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = dateRange.start
      ? new Date(dateRange.start)
      : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    start.setHours(0, 0, 0, 0);

    return { startDate: start, endDate: end };
  }, [dateRange]);

  const { data: records = [], isLoading } = useIntakeRecordsByDateRange(
    user?.id || '',
    startDate,
    endDate
  );

  // Apply filters
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Status filter
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false;
      }

      // Medication filter
      if (medicationFilter !== 'all' && record.medicationId !== medicationFilter) {
        return false;
      }

      return true;
    });
  }, [records, statusFilter, medicationFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMedicationFilter('all');
    setDateRange({ start: '', end: '' });
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm || statusFilter !== 'all' || medicationFilter !== 'all' || dateRange.start || dateRange.end;

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    medicationFilter,
    setMedicationFilter,
    dateRange,
    setDateRange,
    records: filteredRecords,
    allRecords: records,
    isLoading,
    clearFilters,
    hasActiveFilters,
  };
}
