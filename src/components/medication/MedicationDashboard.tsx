import React, { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { IntakeConfirmation } from '@/components/medication';
import {
  useTodaysIntakeRecords,
  useActiveMedications,
  useStreakData,
  useAdherenceStatistics
} from '@/hooks';
import { Medication, IntakeRecord } from '@/types';
import { cn } from '@/utils/cn';

interface MedicationDashboardProps {
  userId: string;
  className?: string;
}

interface UpcomingReminder {
  medication: Medication;
  scheduledTime: Date;
  record?: IntakeRecord;
}

const MedicationDashboard: React.FC<MedicationDashboardProps> = ({
  userId,
  className,
}) => {
  const [selectedMedication, setSelectedMedication] = useState<{
    medication: Medication;
    record?: IntakeRecord;
  } | null>(null);

  const { data: todaysRecords, isLoading: recordsLoading } = useTodaysIntakeRecords(userId);
  const { data: medications, isLoading: medsLoading } = useActiveMedications(userId);
  const { data: streakData } = useStreakData(userId);
  const { data: statistics } = useAdherenceStatistics(userId, 7); // Last 7 days

  // Calculate today's progress
  const todaysProgress = React.useMemo(() => {
    if (!todaysRecords || !medications) return null;

    const totalScheduled = todaysRecords.length;
    const taken = todaysRecords.filter(r => r.status === 'taken').length;
    const missed = todaysRecords.filter(r => r.status === 'missed').length;
    const skipped = todaysRecords.filter(r => r.status === 'skipped').length;
    const pending = todaysRecords.filter(r =>
      new Date() < r.scheduledTime && r.status !== 'taken').length;

    return {
      totalScheduled,
      taken,
      missed,
      skipped,
      pending,
      completionRate: totalScheduled > 0 ? (taken / totalScheduled) * 100 : 0
    };
  }, [todaysRecords, medications]);

  // Get upcoming reminders (next 4 hours)
  const upcomingReminders = React.useMemo(() => {
    if (!medications || !todaysRecords) return [];

    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const upcoming: UpcomingReminder[] = [];

    medications.forEach(medication => {
      if (!medication.times || !medication.isActive) return;

      medication.times.forEach(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (hours === undefined || minutes === undefined) return;

        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        // If the time has passed today, check tomorrow
        if (scheduledTime < now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        // Only include if within next 4 hours
        if (scheduledTime <= fourHoursFromNow) {
          const record = todaysRecords.find(r =>
            r.medicationId === medication.id &&
            Math.abs(r.scheduledTime.getTime() - scheduledTime.getTime()) < 60000 // Within 1 minute
          );

          upcoming.push({
            medication,
            scheduledTime,
            ...(record ? { record } : {})
          });
        }
      });
    });

    return upcoming.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }, [medications, todaysRecords]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleMedicationClick = (medication: Medication, record?: IntakeRecord) => {
    setSelectedMedication(
      record
        ? { medication, record }
        : { medication }
    );
  };

  if (recordsLoading || medsLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-20 bg-neutral-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (selectedMedication) {
    return (
      <div className={className}>
        <IntakeConfirmation
          medication={selectedMedication.medication}
          {...(selectedMedication.record ? { scheduledRecord: selectedMedication.record } : {})}
          onConfirm={() => setSelectedMedication(null)}
          onSkip={() => setSelectedMedication(null)}
          onClose={() => setSelectedMedication(null)}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Welcome Header */}
      <Card className="p-6 bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 font-semibold text-neutral-800 mb-2">
              {getGreeting()}!
            </h1>
            <p className="text-body text-neutral-600">
              {todaysProgress
                ? `${todaysProgress.taken} of ${todaysProgress.totalScheduled} medications taken today`
                : 'Loading your medication schedule...'
              }
            </p>
          </div>
          {streakData && streakData.currentStreak > 0 && (
            <div className="text-center">
              <div className="text-3xl mb-1">🔥</div>
              <div className="text-h3 font-bold text-primary-700">
                {streakData.currentStreak}
              </div>
              <div className="text-caption text-primary-600">
                day streak
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Today's Progress Ring */}
      {todaysProgress && (
        <Card className="p-6">
          <h2 className="text-h2 font-semibold text-neutral-800 mb-4">
            Today's Progress
          </h2>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={
                    todaysProgress.completionRate >= 90
                      ? '#10B981'
                      : todaysProgress.completionRate >= 70
                        ? '#F59E0B'
                        : '#EF4444'
                  }
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(todaysProgress.completionRate / 100) * 440} 440`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-800">
                    {Math.round(todaysProgress.completionRate)}%
                  </div>
                  <div className="text-caption text-neutral-600">
                    Complete
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-success-50 rounded-lg">
              <div className="text-lg font-semibold text-success-700">
                {todaysProgress.taken}
              </div>
              <div className="text-caption text-success-600">Taken</div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="text-lg font-semibold text-neutral-700">
                {todaysProgress.pending}
              </div>
              <div className="text-caption text-neutral-600">Pending</div>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <div className="text-lg font-semibold text-warning-700">
                {todaysProgress.skipped}
              </div>
              <div className="text-caption text-warning-600">Skipped</div>
            </div>
            <div className="p-3 bg-error-50 rounded-lg">
              <div className="text-lg font-semibold text-error-700">
                {todaysProgress.missed}
              </div>
              <div className="text-caption text-error-600">Missed</div>
            </div>
          </div>
        </Card>
      )}

      {/* Upcoming Reminders */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 font-semibold text-neutral-800">
            Upcoming Reminders
          </h2>
          <Badge variant="info" size="sm">
            Next 4 hours
          </Badge>
        </div>

        {upcomingReminders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-body text-neutral-600 mb-2">
              No upcoming reminders
            </p>
            <p className="text-caption text-neutral-500">
              You're all caught up for the next few hours!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingReminders.map((reminder) => (
              <div
                key={`${reminder.medication.id}-${reminder.scheduledTime.getTime()}`}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer',
                  reminder.record?.status === 'taken'
                    ? 'border-success-200 bg-success-50'
                    : 'border-neutral-200 bg-neutral-50 hover:border-primary-300 hover:bg-primary-50'
                )}
                onClick={() => handleMedicationClick(reminder.medication, reminder.record)}
              >
                {/* Medication Image */}
                <div className="flex-shrink-0">
                  {reminder.medication.pillImage ? (
                    <img
                      src={reminder.medication.pillImage}
                      alt={`${reminder.medication.name} pill`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {reminder.medication.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Medication Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-neutral-800 truncate">
                      {reminder.medication.name}
                    </h3>
                    {reminder.record?.status === 'taken' && (
                      <Badge variant="success" size="sm">✓ Taken</Badge>
                    )}
                  </div>
                  <p className="text-body text-neutral-600">
                    {reminder.medication.dosage} {reminder.medication.form}
                  </p>
                  <p className="text-caption text-neutral-500">
                    Scheduled for {formatTime(reminder.scheduledTime)}
                  </p>
                </div>

                {/* Action Button */}
                {reminder.record?.status !== 'taken' && (
                  <div className="flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMedicationClick(reminder.medication, reminder.record);
                      }}
                    >
                      Take Now
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Weekly Progress */}
      {statistics && (
        <Card className="p-6">
          <h2 className="text-h2 font-semibold text-neutral-800 mb-4">
            This Week's Performance
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-lg">
              <div className="text-2xl font-bold text-success-700 mb-1">
                {Math.round(statistics.adherenceRate)}%
              </div>
              <div className="text-caption text-success-600 font-medium">
                Adherence Rate
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 mb-1">
                {Math.round(statistics.onTimeRate)}%
              </div>
              <div className="text-caption text-blue-600 font-medium">
                On-Time Rate
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-body text-neutral-600">
              {statistics.adherenceRate >= 95
                ? "Outstanding performance! Keep up the excellent work! 🏆"
                : statistics.adherenceRate >= 85
                  ? "Great job this week! You're doing excellent! 🌟"
                  : statistics.adherenceRate >= 70
                    ? "Good progress! Keep building that routine! 💪"
                    : "Every day is a new opportunity to improve! 🎯"
              }
            </p>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-h2 font-semibold text-neutral-800 mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="h-12">
            📊 View Full History
          </Button>
          <Button variant="secondary" className="h-12">
            💊 Add Medication
          </Button>
          <Button variant="secondary" className="h-12">
            📅 View Calendar
          </Button>
          <Button variant="secondary" className="h-12">
            ⚙️ Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MedicationDashboard;