import React from 'react';
import { Card, Badge } from '@/components/ui';
import { useStreakData, useAdherenceStatistics } from '@/hooks/useIntakeRecords';
import { cn } from '@/utils/cn';

interface StreakDisplayProps {
  userId: string;
  showMotivation?: boolean;
  compact?: boolean;
  className?: string;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  userId,
  showMotivation = true,
  compact = false,
  className,
}) => {
  const { data: streakData, isLoading: streakLoading } = useStreakData(userId);
  const { data: statistics } = useAdherenceStatistics(userId, 7);

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return '👑';
    if (streak >= 50) return '🏆';
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⭐';
    if (streak >= 7) return '💪';
    if (streak >= 3) return '🎯';
    if (streak >= 1) return '✨';
    return '🌱';
  };

  const getStreakTitle = (streak: number) => {
    if (streak >= 100) return 'Medication Master';
    if (streak >= 50) return 'Consistency Champion';
    if (streak >= 30) return 'Streak Superstar';
    if (streak >= 14) return 'Two Week Warrior';
    if (streak >= 7) return 'Week Winner';
    if (streak >= 3) return 'Building Momentum';
    if (streak >= 1) return 'Getting Started';
    return 'Ready to Begin';
  };

  const getMotivationalMessage = (current: number, longest: number) => {
    if (current === 0) {
      if (longest > 0) {
        return `You've done ${longest} days before - you can do it again! Today is a fresh start. 🌟`;
      }
      return "Every expert was once a beginner. Start your streak today! 🌱";
    }

    if (current === longest && current > 0) {
      return `New personal record! ${current} days and counting! You're unstoppable! 🚀`;
    }

    if (current >= 30) {
      return `${current} days of dedication! You've built an incredible habit. Keep shining! ✨`;
    }

    if (current >= 14) {
      return `Two weeks strong! You're proving that consistency pays off. Amazing work! 💪`;
    }

    if (current >= 7) {
      return `One week down! You're building something special. Keep the momentum going! 🎯`;
    }

    if (current >= 3) {
      return `${current} days in a row! You're creating a powerful routine. Stay focused! 🔥`;
    }

    return `Day ${current}! Every day counts. You're doing great! 🌟`;
  };

  const getNextMilestone = (current: number) => {
    const milestones = [1, 3, 7, 14, 30, 50, 100];
    const next = milestones.find(m => m > current);
    return next ? { target: next, remaining: next - current } : null;
  };

  if (streakLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-16 bg-neutral-200 rounded"></div>
          <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (!streakData) return null;

  const nextMilestone = getNextMilestone(streakData.currentStreak);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-lg', className)}>
        <div className="text-2xl">
          {getStreakEmoji(streakData.currentStreak)}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-success-700">
            {streakData.currentStreak} Day Streak
          </div>
          <div className="text-caption text-success-600">
            {getStreakTitle(streakData.currentStreak)}
          </div>
        </div>
        {nextMilestone && (
          <div className="text-right">
            <div className="text-sm font-medium text-success-700">
              {nextMilestone.remaining} to go
            </div>
            <div className="text-caption text-success-600">
              Next: {nextMilestone.target} days
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">
          {getStreakEmoji(streakData.currentStreak)}
        </div>
        <h2 className="text-h1 font-bold text-neutral-800 mb-2">
          {streakData.currentStreak} Day{streakData.currentStreak !== 1 ? 's' : ''}
        </h2>
        <Badge 
          variant={streakData.currentStreak >= 7 ? 'success' : 'info'} 
          size="lg"
          className="mb-2"
        >
          {getStreakTitle(streakData.currentStreak)}
        </Badge>
      </div>

      {/* Streak Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-1 mb-3">
          {Array.from({ length: Math.min(streakData.currentStreak, 14) }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-success-500 rounded-full"
            />
          ))}
          {streakData.currentStreak > 14 && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-success-600 font-bold">
                +{streakData.currentStreak - 14}
              </span>
            </div>
          )}
        </div>

        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <div className="mb-4">
            <div className="flex justify-between text-caption text-neutral-600 mb-1">
              <span>Progress to {nextMilestone.target} days</span>
              <span>{streakData.currentStreak}/{nextMilestone.target}</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-success-400 to-success-600 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${(streakData.currentStreak / nextMilestone.target) * 100}%`
                }}
              />
            </div>
            <p className="text-center text-caption text-neutral-600 mt-2">
              {nextMilestone.remaining} more day{nextMilestone.remaining !== 1 ? 's' : ''} to reach your next milestone!
            </p>
          </div>
        )}
      </div>

      {/* Personal Best */}
      {streakData.longestStreak > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-800 mb-1">
                Personal Best
              </h3>
              <div className="text-2xl font-bold text-purple-700">
                {streakData.longestStreak} days
              </div>
            </div>
            <div className="text-3xl">🏅</div>
          </div>
          {streakData.currentStreak === streakData.longestStreak && streakData.currentStreak > 0 && (
            <Badge variant="success" size="sm" className="mt-2">
              New Record! 🎉
            </Badge>
          )}
        </div>
      )}

      {/* Weekly Performance */}
      {statistics && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
          <h3 className="font-semibold text-neutral-800 mb-3">
            This Week's Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-primary-700">
                {Math.round(statistics.adherenceRate)}%
              </div>
              <div className="text-caption text-neutral-600">
                Adherence
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-success-700">
                {statistics.takenDoses}
              </div>
              <div className="text-caption text-neutral-600">
                Doses Taken
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Message */}
      {showMotivation && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center">
          <p className="text-body font-medium text-blue-700 leading-relaxed">
            {getMotivationalMessage(streakData.currentStreak, streakData.longestStreak)}
          </p>
        </div>
      )}

      {/* Achievement Badges */}
      <div className="mt-6">
        <h4 className="font-medium text-neutral-700 mb-3 text-center">
          Achievements Unlocked
        </h4>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { threshold: 1, emoji: '🌱', name: 'First Step' },
            { threshold: 3, emoji: '🎯', name: 'Momentum' },
            { threshold: 7, emoji: '💪', name: 'Week Warrior' },
            { threshold: 14, emoji: '⭐', name: 'Two Weeks' },
            { threshold: 30, emoji: '🔥', name: 'Month Master' },
            { threshold: 50, emoji: '🏆', name: 'Champion' },
            { threshold: 100, emoji: '👑', name: 'Legend' },
          ].map(achievement => (
            <div
              key={achievement.threshold}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full text-caption',
                streakData.longestStreak >= achievement.threshold
                  ? 'bg-success-100 text-success-700'
                  : 'bg-neutral-100 text-neutral-500'
              )}
            >
              <span className={cn(
                streakData.longestStreak >= achievement.threshold ? 'grayscale-0' : 'grayscale'
              )}>
                {achievement.emoji}
              </span>
              <span className="font-medium">{achievement.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default StreakDisplay;