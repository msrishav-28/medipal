import React from 'react';
import { Card, Badge } from '@/components/ui';
import { useAdherenceStatistics, useIntakeRecordsByDateRange } from '@/hooks/useIntakeRecords';
import { cn } from '@/utils/cn';

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
    if (rate >= 90) return 'bg-success-500';
    if (rate >= 70) return 'bg-warning-500';
    if (rate > 0) return 'bg-error-500';
    return 'bg-neutral-200';
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
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-24 bg-neutral-200 rounded"></div>
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 h-16 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!statistics) return null;

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-h3 font-semibold text-neutral-800 mb-1">
            Adherence Trend
          </h3>
          <p className="text-body text-neutral-600">
            Last {days} days
          </p>
        </div>
        
        {trend && (
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-2xl',
                trend.direction === 'up' ? 'text-success-500' : 
                trend.direction === 'down' ? 'text-error-500' : 
                'text-neutral-500'
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
                size="sm"
              >
                {trend.direction === 'stable' ? 'Stable' : 
                 `${trend.change.toFixed(1)}% ${trend.isImproving ? 'better' : 'lower'}`}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-primary-50 rounded-lg">
          <div className="text-xl font-bold text-primary-700">
            {Math.round(statistics.adherenceRate)}%
          </div>
          <div className="text-caption text-primary-600">
            Overall
          </div>
        </div>
        <div className="text-center p-3 bg-success-50 rounded-lg">
          <div className="text-xl font-bold text-success-700">
            {statistics.takenDoses}
          </div>
          <div className="text-caption text-success-600">
            Taken
          </div>
        </div>
        <div className="text-center p-3 bg-neutral-50 rounded-lg">
          <div className="text-xl font-bold text-neutral-700">
            {statistics.totalDoses}
          </div>
          <div className="text-caption text-neutral-600">
            Total
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mb-4">
        <div className="flex items-end justify-between gap-1 h-24 mb-2">
          {dailyData.map((day) => (
            <div
              key={day.date.toISOString()}
              className="flex-1 flex flex-col items-center"
            >
              <div className="relative flex-1 flex items-end w-full">
                <div
                  className={cn(
                    'w-full rounded-t transition-all duration-500 ease-out',
                    getBarColor(day.adherenceRate)
                  )}
                  style={{ 
                    height: `${getBarHeight(day.adherenceRate)}%`,
                    minHeight: day.totalDoses > 0 ? '4px' : '2px'
                  }}
                  title={`${formatDate(day.date)}: ${Math.round(day.adherenceRate)}% (${day.takenDoses}/${day.totalDoses})`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Date Labels */}
        <div className="flex justify-between text-caption text-neutral-500">
          {dailyData.map((day, index) => {
            // Show every other day for space, but always show first and last
            const shouldShow = index === 0 || 
                              index === dailyData.length - 1 || 
                              index % Math.ceil(dailyData.length / 5) === 0;
            
            return (
              <div key={day.date.toISOString()} className="flex-1 text-center">
                {shouldShow && (
                  <span className="text-xs">
                    {formatDate(day.date)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-caption">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-success-500 rounded"></div>
          <span className="text-neutral-600">≥90%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-warning-500 rounded"></div>
          <span className="text-neutral-600">70-89%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-error-500 rounded"></div>
          <span className="text-neutral-600">&lt;70%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-neutral-200 rounded"></div>
          <span className="text-neutral-600">No doses</span>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
        <p className="text-body text-neutral-700">
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
    </Card>
  );
};

export default AdherenceChart;