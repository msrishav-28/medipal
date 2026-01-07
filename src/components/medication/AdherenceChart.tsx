import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui';
import { useAdherenceStatistics, useIntakeRecordsByDateRange } from '@/hooks/useIntakeRecords';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

interface AdherenceChartProps {
  userId: string;
  days?: number;
  showTrend?: boolean;
  className?: string;
}

interface DayData {
  date: Date;
  adherenceRate: number;
  totalDoses: number;
  takenDoses: number;
}

const AdherenceChart: React.FC<AdherenceChartProps> = ({
  userId,
  days = 14,
  showTrend = true,
  className,
}) => {
  const { data: statistics, isLoading } = useAdherenceStatistics(userId, days);

  // Get daily breakdown for the chart
  const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  const endDate = new Date();
  const { data: records } = useIntakeRecordsByDateRange(userId, startDate, endDate);

  // Calculate daily adherence data
  const dailyData = React.useMemo(() => {
    if (!records) return [];

    const dataMap = new Map<string, DayData>();

    // Initialize all days with zero data
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toDateString();
      dataMap.set(dateKey, {
        date,
        adherenceRate: 0,
        totalDoses: 0,
        takenDoses: 0
      });
    }

    // Populate with actual data
    records.forEach(record => {
      const dateKey = record.scheduledTime.toDateString();
      const dayData = dataMap.get(dateKey);

      if (dayData) {
        dayData.totalDoses++;
        if (record.status === 'taken') {
          dayData.takenDoses++;
        }
        dayData.adherenceRate = dayData.totalDoses > 0
          ? (dayData.takenDoses / dayData.totalDoses) * 100
          : 0;
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [records, days, startDate]);

  const getBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-success-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    if (rate >= 70) return 'bg-warning-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    if (rate > 0) return 'bg-error-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
    return 'bg-white/10';
  };

  const getBarHeight = (rate: number) => {
    return Math.max(4, (rate / 100) * 100); // Minimum 4px height, max 100px
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTrend = () => {
    if (dailyData.length < 7) return null;

    const firstWeek = dailyData.slice(0, 7);
    const secondWeek = dailyData.slice(-7);

    const firstWeekAvg = firstWeek.reduce((sum, day) => sum + day.adherenceRate, 0) / 7;
    const secondWeekAvg = secondWeek.reduce((sum, day) => sum + day.adherenceRate, 0) / 7;

    const trend = secondWeekAvg - firstWeekAvg;

    return {
      direction: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable',
      change: Math.abs(trend),
      isImproving: trend > 0
    };
  };

  const trend = showTrend ? calculateTrend() : null;

  if (isLoading) {
    return (
      <GlassCard className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="h-24 bg-white/10 rounded"></div>
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 h-16 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!statistics) return null;

  return (
    <GlassCard className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold font-heading text-foreground mb-1">
            Adherence Trend
          </h3>
          <p className="text-sm text-muted-foreground">
            Last {days} days
          </p>
        </div>

        {trend && (
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-2xl',
                trend.direction === 'up' ? 'text-success-500' :
                  trend.direction === 'down' ? 'text-error-500' :
                    'text-muted-foreground'
              )}>
                {trend.direction === 'up' ? '📈' :
                  trend.direction === 'down' ? '📉' :
                    '➡️'}
              </span>
              <Badge
                variant={
                  trend.direction === 'up' ? 'success' :
                    trend.direction === 'down' ? 'error' :
                      'secondary'
                }
              >
                {trend.direction === 'stable' ? 'Stable' :
                  `${trend.change.toFixed(1)}% ${trend.isImproving ? 'better' : 'lower'}`}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
          <div className="text-2xl font-bold text-primary">
            {Math.round(statistics.adherenceRate)}%
          </div>
          <div className="text-xs font-medium uppercase tracking-wider text-primary/80">
            Overall
          </div>
        </div>
        <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
          <div className="text-2xl font-bold text-green-500">
            {statistics.takenDoses}
          </div>
          <div className="text-xs font-medium uppercase tracking-wider text-green-500/80">
            Taken
          </div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-foreground">
            {statistics.totalDoses}
          </div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-2 h-32 mb-3">
          {dailyData.map((day, i) => (
            <div
              key={day.date.toISOString()}
              className="flex-1 flex flex-col items-center group relative"
            >
              <div className="relative flex-1 flex items-end w-full bg-white/5 rounded-t-lg overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${getBarHeight(day.adherenceRate)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={cn(
                    'w-full rounded-t transition-all duration-300',
                    getBarColor(day.adherenceRate)
                  )}
                />
              </div>

              {/* Tooltip */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs p-2 rounded pointer-events-none whitespace-nowrap z-10">
                {Math.round(day.adherenceRate)}% ({day.takenDoses}/{day.totalDoses})
              </div>
            </div>
          ))}
        </div>

        {/* Date Labels */}
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          {dailyData.map((day, index) => {
            // Show every other day for space, but always show first and last
            const shouldShow = index === 0 ||
              index === dailyData.length - 1 ||
              index % Math.ceil(dailyData.length / 5) === 0;

            return (
              <div key={day.date.toISOString()} className="flex-1 text-center">
                {shouldShow && (
                  <span>
                    {formatDate(day.date)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-sm font-medium text-foreground text-center">
          {statistics.adherenceRate >= 95
            ? "Excellent consistency! You're maintaining outstanding adherence. 🏆"
            : statistics.adherenceRate >= 85
              ? "Great job! Your adherence is very good. Keep up the momentum! 🌟"
              : statistics.adherenceRate >= 70
                ? "Good progress! Consider setting more reminders to improve consistency. 💪"
                : statistics.adherenceRate >= 50
                  ? "There's room for improvement. Try using more reminder features. 🎯"
                  : "Let's work together to build a better routine. Small steps lead to big improvements! 💙"
          }
        </p>
      </div>
    </GlassCard>
  );
};

export default AdherenceChart;