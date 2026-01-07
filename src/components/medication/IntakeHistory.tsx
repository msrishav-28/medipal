import React, { useState } from 'react';
import { IntakeRecord } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { useIntakeHistory } from '@/hooks/useIntakeRecords';
import { useMedications } from '@/hooks/useMedications';
import { cn } from '@/utils/cn';
import { Calendar, ClipboardList, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

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
        hour: 'numeric',
        minute: '2-digit'
      })
    };
  };

  const getStatusBadge = (record: IntakeRecord) => {
    switch (record.status) {
      case 'taken':
        return <Badge variant="success" className="bg-green-500/20 text-green-500 border-green-500/50">Taken</Badge>;
      case 'missed':
        return <Badge variant="error" className="bg-red-500/20 text-red-500 border-red-500/50">Missed</Badge>;
      case 'skipped':
        return <Badge variant="warning" className="bg-amber-500/20 text-amber-500 border-amber-500/50">Skipped</Badge>;
      default:
        return <Badge variant="secondary" className="bg-white/10 text-muted-foreground">Unknown</Badge>;
    }
  };

  const getTimingInfo = (record: IntakeRecord) => {
    if (record.status !== 'taken' || !record.actualTime) return null;

    const timeDiff = record.actualTime.getTime() - record.scheduledTime.getTime();
    const minutesDiff = Math.round(timeDiff / (1000 * 60));

    if (Math.abs(minutesDiff) <= 15) {
      return <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> On time</span>;
    } else if (minutesDiff > 0) {
      return <span className="text-amber-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {minutesDiff}m late</span>;
    } else {
      return <span className="text-blue-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.abs(minutesDiff)}m early</span>;
    }
  };

  if (isLoading) {
    return (
      <GlassCard className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold font-heading text-foreground mb-1 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Intake History
          </h3>
          <p className="text-sm text-muted-foreground">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Simple count summary if needed */}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
          {/* Date Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
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
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                    dateFilter === option.value
                      ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                      : 'bg-white/5 text-muted-foreground border-transparent hover:bg-white/10 hover:text-foreground'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
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
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                    statusFilter === option.value
                      ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                      : 'bg-white/5 text-muted-foreground border-transparent hover:bg-white/10 hover:text-foreground'
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
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-foreground font-medium mb-1">
              No intake records found
            </p>
            <p className="text-sm text-muted-foreground">
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
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group"
              >
                {/* Status Indicator */}
                <div className={cn(
                  'w-2 h-full py-6 rounded-full flex-shrink-0 self-stretch',
                  {
                    'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]': record.status === 'taken',
                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]': record.status === 'missed',
                    'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]': record.status === 'skipped',
                  }
                )} />

                {/* Medication Info */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h4 className="font-bold text-foreground truncate text-lg">
                      {getMedicationName(record.medicationId)}
                    </h4>
                    {getStatusBadge(record)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-mono"><Clock className="w-3.5 h-3.5" /> {date} at {time}</span>
                    {actualTime && (
                      <span className="text-foreground/80">Taken: {actualTime.time}</span>
                    )}
                    {getTimingInfo(record)}
                  </div>

                  {record.skipReason && (
                    <p className="text-xs text-amber-500 mt-2 flex items-center gap-1.5 bg-amber-500/10 p-1.5 rounded w-fit">
                      <AlertCircle className="w-3 h-3" />
                      Reason: {record.skipReason}
                    </p>
                  )}
                </div>

                {/* Snooze Count */}
                {record.snoozeCount > 0 && (
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5">
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
          <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
            Load More Records
          </Button>
        </div>
      )}
    </GlassCard>
  );
};

export default IntakeHistory;
