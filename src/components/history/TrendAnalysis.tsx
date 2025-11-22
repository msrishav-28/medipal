import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, AlertTriangle, Award, Lightbulb } from 'lucide-react';
import { useIntakeRecordsByDateRange } from '@/hooks/useIntakeRecords';
import { useMedications } from '@/hooks/useMedications';
import { useCurrentUser } from '@/hooks/useUser';
import {
  calculateAdherenceStats,
  calculateTrend,
  getDailyAdherence,
  getMedicationAdherence,
  generateInsights,
  getTimeOfDayAnalysis,
  type Insight,
} from '@/utils/analytics';

interface TrendAnalysisProps {
  days?: number;
}

export function TrendAnalysis({ days = 30 }: TrendAnalysisProps) {
  const { data: user } = useCurrentUser();
  
  // Get records for the specified period
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: records = [], isLoading } = useIntakeRecordsByDateRange(
    user?.id || '',
    startDate,
    endDate
  );
  
  const { data: medications = [] } = useMedications(user?.id || '');

  // Calculate analytics
  const stats = useMemo(() => calculateAdherenceStats(records), [records]);
  const trend = useMemo(() => calculateTrend(records, 7), [records]);
  const dailyData = useMemo(() => getDailyAdherence(records, days), [records, days]);
  const medAdherence = useMemo(
    () => getMedicationAdherence(records, medications),
    [records, medications]
  );
  const insights = useMemo(
    () => generateInsights(stats, trend, dailyData),
    [stats, trend, dailyData]
  );
  const timeAnalysis = useMemo(() => getTimeOfDayAnalysis(records), [records]);

  const getTrendIcon = () => {
    if (trend.direction === 'improving') {
      return <TrendingUp className="w-6 h-6 text-green-600" />;
    } else if (trend.direction === 'declining') {
      return <TrendingDown className="w-6 h-6 text-red-600" />;
    }
    return <Minus className="w-6 h-6 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (trend.direction === 'improving') return 'text-green-600';
    if (trend.direction === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const bestTimeOfDay = useMemo(() => {
    const times = Object.entries(timeAnalysis) as Array<[string, number]>;
    if (times.length === 0) return null;
    return times.reduce((best, current) => (current[1] > best[1] ? current : best), times[0]!);
  }, [timeAnalysis]);

  const worstTimeOfDay = useMemo(() => {
    const times = Object.entries(timeAnalysis).filter(([_, rate]) => rate > 0) as Array<
      [string, number]
    >;
    if (times.length === 0) return null;
    return times.reduce((worst, current) => (current[1] < worst[1] ? current : worst), times[0]!);
  }, [timeAnalysis]);

  const bestMedication = useMemo(() => {
    if (medAdherence.length === 0) return null;
    return medAdherence.reduce((best, current) =>
      current.adherenceRate > best.adherenceRate ? current : best
    );
  }, [medAdherence]);

  const worstMedication = useMemo(() => {
    if (medAdherence.length === 0) return null;
    return medAdherence.reduce((worst, current) =>
      current.adherenceRate < worst.adherenceRate ? current : worst
    );
  }, [medAdherence]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
        <p className="text-gray-500 text-center py-12">
          No data available for analysis. Start taking your medications to see insights!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trend Overview */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Trend Analysis</h3>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm md:text-base font-medium ${getTrendColor()}`}>
              {trend.direction === 'improving' && 'Improving'}
              {trend.direction === 'declining' && 'Declining'}
              {trend.direction === 'stable' && 'Stable'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-600">Overall</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-blue-700">
              {stats.overall.toFixed(0)}%
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-600">Weekly</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-700">
              {stats.weekly.toFixed(0)}%
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-medium text-purple-600">On-Time</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-purple-700">
              {stats.onTimeRate.toFixed(0)}%
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-600">Change</p>
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${getTrendColor()}`}>
              {trend.change > 0 ? '+' : ''}
              {trend.change.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Period Comparison */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-3">7-Day Period Comparison</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Period</p>
              <p className="text-xl font-bold text-gray-900">
                {trend.currentPeriod.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Previous Period</p>
              <p className="text-xl font-bold text-gray-900">
                {trend.previousPeriod.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
          Insights & Recommendations
        </h3>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-700">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time of Day Analysis */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
          Time of Day Performance
        </h3>
        <div className="space-y-3">
          {Object.entries(timeAnalysis).map(([time, rate]) => (
            <div key={time}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">{time}</span>
                <span className="text-sm font-semibold text-gray-900">{rate.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    rate >= 90
                      ? 'bg-green-500'
                      : rate >= 75
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {bestTimeOfDay && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-green-600">Best time:</span>{' '}
              <span className="capitalize">{bestTimeOfDay[0]}</span> ({bestTimeOfDay[1].toFixed(0)}%)
            </p>
            {worstTimeOfDay && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium text-red-600">Needs improvement:</span>{' '}
                <span className="capitalize">{worstTimeOfDay[0]}</span> ({worstTimeOfDay[1].toFixed(0)}%)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Medication Performance */}
      {medAdherence.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            Medication Performance
          </h3>
          <div className="space-y-3">
            {medAdherence
              .sort((a, b) => b.adherenceRate - a.adherenceRate)
              .map((med) => (
                <div key={med.medicationId}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-4">
                      {med.medicationName}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {med.adherenceRate.toFixed(0)}% ({med.takenDoses}/{med.totalDoses})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        med.adherenceRate >= 90
                          ? 'bg-green-500'
                          : med.adherenceRate >= 75
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${med.adherenceRate}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {bestMedication && worstMedication && medAdherence.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-green-600">Best adherence:</span>{' '}
                {bestMedication.medicationName} ({bestMedication.adherenceRate.toFixed(0)}%)
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-red-600">Needs attention:</span>{' '}
                {worstMedication.medicationName} ({worstMedication.adherenceRate.toFixed(0)}%)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
