import React, { useState } from 'react';
import { IntakeRecord } from '@/types';
import { Card, Button, Badge } from '@/components/ui';
import { useIntakeHistory } from '@/hooks/useIntakeRecords';
import { useMedications } from '@/hooks/useMedications';
import { cn } from '@/utils/cn';

interface IntakeHistoryProps {
  userId: string;
  medicationId?: string;
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

const IntakeHistory: React.FC<IntakeHistoryProps> = ({
  userId,
  medicationId,
  limit = 50,
  showFilters = true,
  className,
}) => {
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('week');
  const [statusFilter, setStatusFilter] = useState<'all' | 'taken' | 'missed' | 'skipped'>('all');
  
  const { data: medications } = useMedications(userId);
  const { data: allHistory, isLoading } = useIntakeHistory(userId, limit);

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: now };
      case 'month':
        const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start: monthStart, end: now };
      default:
        return null;
    }
  };

  // Filter records based on current filters
  const filteredRecords = React.useMemo(() => {
    if (!allHistory) return [];
    
    let filtered = allHistory;

    // Filter by medication if specified
    if (medicationId) {
      filtered = filtered.filter(record => record.medicationId === medicationId);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const range = getDateRange();
      if (range) {
        filtered = filtered.filter(record => 
          record.scheduledTime >= range.start && record.scheduledTime <= range.end
        );
      }
    }

    return filtered;
  }, [allHistory, medicationId, statusFilter, dateFilter]);

  const getMedicationName = (medicationId: string) => {
    const medication = medications?.find(m => m.id === medicationId);
    return medication?.name || 'Unknown Medication';
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      }),
      time: date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getStatusBadge = (record: IntakeRecord) => {
    switch (record.status) {
      case 'taken':
        return <Badge variant="success" size="sm">Taken</Badge>;
      case 'missed':
        return <Badge variant="error" size="sm">Missed</Badge>;
      case 'skipped':
        return <Badge variant="warning" size="sm">Skipped</Badge>;
      default:
        return <Badge variant="secondary" size="sm">Unknown</Badge>;
    }
  };

  const getTimingInfo = (record: IntakeRecord) => {
    if (record.status !== 'taken' || !record.actualTime) return null;
    
    const timeDiff = record.actualTime.getTime() - record.scheduledTime.getTime();
    const minutesDiff = Math.round(timeDiff / (1000 * 60));
    
    if (Math.abs(minutesDiff) <= 15) {
      return <span className="text-success-600 text-caption">On time</span>;
    } else if (minutesDiff > 0) {
      return <span className="text-warning-600 text-caption">{minutesDiff}m late</span>;
    } else {
      return <span className="text-info-600 text-caption">{Math.abs(minutesDiff)}m early</span>;
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-neutral-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-h3 font-semibold text-neutral-800 mb-2">
          Intake History
        </h3>
        <p className="text-body text-neutral-600">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 space-y-4">
          {/* Date Filter */}
          <div>
            <label className="block text-body font-medium text-neutral-700 mb-2">
              Time Period
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Last Week' },
                { value: 'month', label: 'Last Month' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateFilter(option.value as any)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-body font-medium transition-colors',
                    dateFilter === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-body font-medium text-neutral-700 mb-2">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All' },
                { value: 'taken', label: 'Taken' },
                { value: 'missed', label: 'Missed' },
                { value: 'skipped', label: 'Skipped' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value as any)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-body font-medium transition-colors',
                    statusFilter === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-body text-neutral-600 mb-2">
              No intake records found
            </p>
            <p className="text-caption text-neutral-500">
              Records will appear here as you take your medications
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const { date, time } = formatDateTime(record.scheduledTime);
            const actualTime = record.actualTime ? formatDateTime(record.actualTime) : null;
            
            return (
              <div
                key={record.id}
                className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                {/* Status Indicator */}
                <div className={cn(
                  'w-3 h-3 rounded-full flex-shrink-0',
                  {
                    'bg-success-500': record.status === 'taken',
                    'bg-error-500': record.status === 'missed',
                    'bg-warning-500': record.status === 'skipped',
                  }
                )} />

                {/* Medication Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-neutral-800 truncate">
                      {getMedicationName(record.medicationId)}
                    </h4>
                    {getStatusBadge(record)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-caption text-neutral-600">
                    <span>Scheduled: {date} at {time}</span>
                    {actualTime && (
                      <span>Taken: {actualTime.time}</span>
                    )}
                    {getTimingInfo(record)}
                  </div>

                  {record.skipReason && (
                    <p className="text-caption text-warning-600 mt-1">
                      Reason: {record.skipReason}
                    </p>
                  )}
                </div>

                {/* Snooze Count */}
                {record.snoozeCount > 0 && (
                  <div className="flex-shrink-0">
                    <Badge variant="secondary" size="sm">
                      {record.snoozeCount} snooze{record.snoozeCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      {filteredRecords.length >= limit && (
        <div className="mt-6 text-center">
          <Button variant="secondary" size="sm">
            Load More Records
          </Button>
        </div>
      )}
    </Card>
  );
};

export default IntakeHistory;