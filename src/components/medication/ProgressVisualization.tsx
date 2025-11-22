import React from 'react';
import { Card, Badge } from '@/components/ui';
import { useStreakData, useAdherenceStatistics } from '@/hooks/useIntakeRecords';
import { cn } from '@/utils/cn';

interface ProgressVisualizationProps {
  userId: string;
  days?: number;
  showDetailed?: boolean;
  className?: string;
}

const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  userId,
  days = 30,
  showDetailed = false,
  className,
}) => {
  const { data: streakData, isLoading: streakLoading } = useStreakData(userId);
  const { data: statistics, isLoading: statsLoading } = useAdherenceStatistics(userId, days);

  if (streakLoading || statsLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4" data-testid="loading-skeleton">
          <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-8 bg-neutral-200 rounded"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!streakData || !statistics) {
    return null;
  }

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '💪';
    return '🎯';
  };

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-h3 font-semibold text-neutral-800 mb-2">
          Your Progress
        </h3>
        <p className="text-body text-neutral-600">
          Last {days} days
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current Streak */}
        <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-lg">
          <div className="text-3xl mb-2">
            {getStreakIcon(streakData.currentStreak)}
          </div>
          <div className="text-2xl font-bold text-success-700 mb-1">
            {streakData.currentStreak}
          </div>
          <div className="text-caption text-success-600 font-medium">
            Day Streak
          </div>
        </div>

        {/* Adherence Rate */}
        <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-primary-700 mb-1">
            {Math.round(statistics.adherenceRate)}%
          </div>
          <div className="text-caption text-primary-600 font-medium">
            Adherence
          </div>
        </div>
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={
                statistics.adherenceRate >= 90 
                  ? '#10B981' 
                  : statistics.adherenceRate >= 70 
                  ? '#F59E0B' 
                  : '#EF4444'
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(statistics.adherenceRate / 100) * 314} 314`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-neutral-800">
                {Math.round(statistics.adherenceRate)}%
              </div>
              <div className="text-caption text-neutral-600">
                Complete
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      {showDetailed && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-success-50 rounded-lg">
              <div className="text-lg font-semibold text-success-700">
                {statistics.takenDoses}
              </div>
              <div className="text-caption text-success-600">Taken</div>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <div className="text-lg font-semibold text-warning-700">
                {statistics.skippedDoses}
              </div>
              <div className="text-caption text-warning-600">Skipped</div>
            </div>
            <div className="p-3 bg-error-50 rounded-lg">
              <div className="text-lg font-semibold text-error-700">
                {statistics.missedDoses}
              </div>
              <div className="text-caption text-error-600">Missed</div>
            </div>
          </div>

          {/* On-time Rate */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-body font-medium text-neutral-700">
                On-time Rate
              </span>
              <Badge 
                variant={statistics.onTimeRate >= 80 ? 'success' : 'warning'}
                size="sm"
              >
                {Math.round(statistics.onTimeRate)}%
              </Badge>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-1000',
                  statistics.onTimeRate >= 80 ? 'bg-success-500' : 'bg-warning-500'
                )}
                style={{ width: `${statistics.onTimeRate}%` }}
              />
            </div>
            <p className="text-caption text-neutral-600 mt-2">
              Doses taken within 30 minutes of scheduled time
            </p>
          </div>

          {/* Longest Streak */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-body font-medium text-neutral-700 mb-1">
                  Personal Best
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {streakData.longestStreak} days
                </div>
              </div>
              <div className="text-3xl">🏅</div>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Message */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center">
        <p className="text-body font-medium text-blue-700">
          {statistics.adherenceRate >= 95 
            ? "Outstanding! You're a medication management champion! 🏆"
            : statistics.adherenceRate >= 85
            ? "Great job! You're doing excellent with your medications! 🌟"
            : statistics.adherenceRate >= 70
            ? "Good progress! Keep building that healthy routine! 💪"
            : "Every day is a new opportunity to improve! You've got this! 🎯"
          }
        </p>
      </div>
    </Card>
  );
};

export default ProgressVisualization;