import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { useIntakeHistory } from '@/hooks/useIntakeRecords';
import { useMedications } from '@/hooks/useMedications';
import { useCurrentUser } from '@/hooks/useUser';
import type { IntakeRecord } from '@/types';

interface MedicationHistoryProps {
  limit?: number;
}

type StatusFilter = 'all' | 'taken' | 'missed' | 'skipped';

export function MedicationHistory({ limit = 100 }: MedicationHistoryProps) {
  const { data: user } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [medicationFilter, setMedicationFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const { data: intakeHistory = [], isLoading } = useIntakeHistory(user?.id || '', limit);
  const { data: medications = [] } = useMedications(user?.id || '');

  // Create a medication map for quick lookups
  const medicationMap = useMemo(() => {
    return medications.reduce((acc, med) => {
      acc[med.id] = med;
      return acc;
    }, {} as Record<string, typeof medications[0]>);
  }, [medications]);

  // Filter and search intake records
  const filteredRecords = useMemo(() => {
    return intakeHistory.filter((record) => {
      const medication = medicationMap[record.medicationId];
      if (!medication) return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = medication.name.toLowerCase().includes(searchLower);
        const matchesDosage = medication.dosage.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDosage) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false;
      }

      // Medication filter
      if (medicationFilter !== 'all' && record.medicationId !== medicationFilter) {
        return false;
      }

      // Date range filter
      if (dateRange.start) {
        const recordDate = new Date(record.scheduledTime);
        const startDate = new Date(dateRange.start);
        if (recordDate < startDate) return false;
      }

      if (dateRange.end) {
        const recordDate = new Date(record.scheduledTime);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (recordDate > endDate) return false;
      }

      return true;
    });
  }, [intakeHistory, medicationMap, searchTerm, statusFilter, medicationFilter, dateRange]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('default', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'missed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'taken':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'missed':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'skipped':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMedicationFilter('all');
    setDateRange({ start: '', end: '' });
  };

  const hasActiveFilters =
    searchTerm || statusFilter !== 'all' || medicationFilter !== 'all' || dateRange.start || dateRange.end;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
          Medication History
        </h2>
        <p className="text-sm text-gray-500">
          View and filter your complete medication intake history
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medications..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="taken">Taken</option>
              <option value="missed">Missed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          {/* Medication Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={medicationFilter}
              onChange={(e) => setMedicationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Medications</option>
              {medications.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Start date"
            />
          </div>
        </div>

        {/* End Date (Second Row on Mobile) */}
        <div className="md:hidden">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="End date"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredRecords.length} of {intakeHistory.length} records
      </div>

      {/* History List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 mt-3">Loading history...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {hasActiveFilters
                ? 'No records match your filters'
                : 'No medication history yet'}
            </p>
          </div>
        ) : (
          filteredRecords.map((record: IntakeRecord) => {
            const medication = medicationMap[record.medicationId];
            if (!medication) return null;

            return (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(record.status)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {medication.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{medication.dosage}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(record.scheduledTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(record.scheduledTime)}</span>
                        </div>
                        {record.actualTime && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Taken at {formatTime(record.actualTime)}</span>
                          </div>
                        )}
                      </div>
                      {record.skipReason && (
                        <p className="text-xs text-gray-500 mt-2">
                          <span className="font-medium">Reason:</span> {record.skipReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={getStatusBadge(record.status)}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
