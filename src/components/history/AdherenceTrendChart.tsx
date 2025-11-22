import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useIntakeRecordsByDateRange } from '@/hooks/useIntakeRecords';
import { useCurrentUser } from '@/hooks/useUser';
import type { IntakeRecord } from '@/types';

interface AdherenceTrendChartProps {
  days?: number;
}

interface DailyData {
  date: Date;
  adherenceRate: number;
  taken: number;
  total: number;
}

export function AdherenceTrendChart({ days = 30 }: AdherenceTrendChartProps) {
  const { data: user } = useCurrentUser();
  
  // Get records for the specified date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data: records = [], isLoading } = useIntakeRecordsByDateRange(
    user?.id || '',
    startDate,
    endDate
  );

  // Calculate daily adherence data
  const chartData = useMemo((): DailyData[] => {
    if (!records.length) return [];

    // Group records by date
    const recordsByDate: Record<string, IntakeRecord[]> = {};
    
    records.forEach((record) => {
      const date = new Date(record.scheduledTime);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0] || '';
      
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = [];
      }
      recordsByDate[dateKey]!.push(record);
    });

    // Convert to array and calculate adherence for each day
    const dailyData: DailyData[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0] || '';
      
      const dayRecords = recordsByDate[dateKey] || [];
      const total = dayRecords.length;
      const taken = dayRecords.filter((r: IntakeRecord) => r.status === 'taken').length;
      const adherenceRate = total > 0 ? (taken / total) * 100 : 0;
      
      dailyData.push({
        date,
        adherenceRate,
        taken,
        total,
      });
    }

    return dailyData;
  }, [records, days, startDate]);

  const trend = useMemo(() => {
    if (chartData.length < 14) return 'stable';

    const recentDays = chartData.slice(-7).filter((d) => d.total > 0);
    const previousDays = chartData.slice(-14, -7).filter((d) => d.total > 0);

    if (recentDays.length === 0 || previousDays.length === 0) return 'stable';

    const recent =
      recentDays.reduce((sum: number, day: DailyData) => sum + day.adherenceRate, 0) /
      recentDays.length;
    const previous =
      previousDays.reduce((sum: number, day: DailyData) => sum + day.adherenceRate, 0) /
      previousDays.length;

    if (recent > previous + 5) return 'up';
    if (recent < previous - 5) return 'down';
    return 'stable';
  }, [chartData]);

  const stats = useMemo(() => {
    const daysWithData = chartData.filter((d) => d.total > 0);
    const totalDoses = chartData.reduce((sum: number, d: DailyData) => sum + d.total, 0);
    const takenDoses = chartData.reduce((sum: number, d: DailyData) => sum + d.taken, 0);
    const avgAdherence =
      daysWithData.length > 0
        ? daysWithData.reduce((sum: number, d: DailyData) => sum + d.adherenceRate, 0) /
          daysWithData.length
        : 0;
    const bestDay = Math.max(...daysWithData.map((d: DailyData) => d.adherenceRate), 0);
    const worstDay = Math.min(
      ...daysWithData.map((d: DailyData) => d.adherenceRate).filter((rate: number) => rate > 0),
      100
    );

    return {
      totalDoses,
      takenDoses,
      avgAdherence,
      bestDay,
      worstDay: worstDay === 100 ? 0 : worstDay,
    };
  }, [chartData]);

  const maxAdherence = Math.max(...chartData.map((d: DailyData) => d.adherenceRate), 100);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adherence Trend</h3>
        <p className="text-gray-500 text-center py-12">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Adherence Trend</h3>
          <p className="text-sm text-gray-500 mt-1">Last {days} days</p>
        </div>
        <div className="flex items-center gap-2">
          {trend === 'up' && (
            <>
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Improving</span>
            </>
          )}
          {trend === 'down' && (
            <>
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">Declining</span>
            </>
          )}
          {trend === 'stable' && (
            <>
              <Minus className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Stable</span>
            </>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative h-64 md:h-80">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full pb-8 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 25, 50, 75, 100].map((value: number) => (
              <div key={value} className="border-t border-gray-200" />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between gap-0.5 md:gap-1">
            {chartData.map((day: DailyData, index: number) => {
              const height = (day.adherenceRate / maxAdherence) * 100;
              const color =
                day.total === 0
                  ? 'bg-gray-200'
                  : day.adherenceRate === 100
                  ? 'bg-green-500'
                  : day.adherenceRate >= 80
                  ? 'bg-green-400'
                  : day.adherenceRate >= 60
                  ? 'bg-yellow-400'
                  : day.adherenceRate >= 40
                  ? 'bg-orange-400'
                  : 'bg-red-400';

              return (
                <div
                  key={index}
                  className="flex-1 flex items-end group relative"
                  style={{ height: '100%' }}
                >
                  <div
                    className={`w-full ${color} rounded-t transition-all duration-200 hover:opacity-80`}
                    style={{ height: day.total === 0 ? '2%' : `${height}%` }}
                  >
                    {/* Tooltip */}
                    {day.total > 0 && (
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none transition-opacity z-10">
                        <div className="font-medium">
                          {day.date.toLocaleDateString('default', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="mt-1">
                          {day.adherenceRate.toFixed(0)}% ({day.taken}/{day.total})
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis labels - show every few days depending on chart width */}
        <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500">
          {chartData
            .filter((_: DailyData, index: number) => {
              // Show fewer labels on mobile
              const step = days > 30 ? 7 : days > 14 ? 3 : 2;
              return index === 0 || index === chartData.length - 1 || index % step === 0;
            })
            .map((day: DailyData, index: number) => (
              <span key={index}>
                {day.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
              </span>
            ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">
            {stats.avgAdherence.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Best Day</p>
          <p className="text-lg md:text-xl font-bold text-green-600">
            {stats.bestDay.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Worst Day</p>
          <p className="text-lg md:text-xl font-bold text-red-600">
            {stats.worstDay.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Doses</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">{stats.totalDoses}</p>
        </div>
      </div>
    </div>
  );
}
