import React, { useState } from 'react';
import { Medication, IntakeRecord } from '@/types';
import { Button, Card, Badge } from '@/components/ui';
import { useMarkDoseAsTaken, useMarkDoseAsSkipped, useStreakData } from '@/hooks/useIntakeRecords';
import { cn } from '@/utils/cn';

interface IntakeConfirmationProps {
  medication: Medication;
  scheduledRecord?: IntakeRecord;
  onConfirm?: (recordId: string) => void;
  onSkip?: (recordId: string, reason?: string) => void;
  onClose?: () => void;
  className?: string;
}

const SKIP_REASONS = [
  'Forgot to take it',
  'Side effects',
  'Feeling better',
  'Out of medication',
  'Doctor advised to skip',
  'Other'
];

const IntakeConfirmation: React.FC<IntakeConfirmationProps> = ({
  medication,
  scheduledRecord,
  onConfirm,
  onSkip,
  onClose,
  className,
}) => {
  const [showSkipReasons, setShowSkipReasons] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);

  const markAsTaken = useMarkDoseAsTaken();
  const markAsSkipped = useMarkDoseAsSkipped();
  const { data: streakData } = useStreakData(medication.userId);

  const handleConfirmTaken = async () => {
    if (!scheduledRecord) return;

    setIsConfirming(true);
    try {
      await markAsTaken.mutateAsync({
        id: scheduledRecord.id,
        actualTime: new Date()
      });

      onConfirm?.(scheduledRecord.id);
    } catch (error) {
      console.error('Failed to mark dose as taken:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSkipDose = async () => {
    if (!scheduledRecord) return;

    const reason = selectedReason === 'Other' ? customReason : selectedReason;

    try {
      await markAsSkipped.mutateAsync(
        reason
          ? { id: scheduledRecord.id, reason }
          : { id: scheduledRecord.id }
      );

      onSkip?.(scheduledRecord.id, reason);
    } catch (error) {
      console.error('Failed to mark dose as skipped:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEncouragingMessage = () => {
    if (!streakData) return "Great job staying on track!";

    const { currentStreak } = streakData;

    if (currentStreak === 0) {
      return "Let's start a new streak today!";
    } else if (currentStreak < 7) {
      return `${currentStreak} day streak! Keep it up!`;
    } else if (currentStreak < 30) {
      return `Amazing ${currentStreak} day streak! 🎉`;
    } else {
      return `Incredible ${currentStreak} day streak! You're a champion! 🏆`;
    }
  };

  if (showSkipReasons) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center mb-6">
          <h3 className="text-h3 font-semibold text-neutral-800 mb-2">
            Why are you skipping this dose?
          </h3>
          <p className="text-body text-neutral-600">
            This helps us understand your medication patterns
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {SKIP_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={cn(
                'w-full p-3 text-left rounded-lg border-2 transition-colors',
                selectedReason === reason
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
              )}
            >
              {reason}
            </button>
          ))}
        </div>

        {selectedReason === 'Other' && (
          <div className="mb-6">
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify the reason..."
              className="w-full p-3 border border-neutral-300 rounded-lg resize-none"
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowSkipReasons(false)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={handleSkipDose}
            disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
            className="flex-1"
          >
            Skip Dose
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          {medication.pillImage ? (
            <img
              src={medication.pillImage}
              alt={`${medication.name} pill`}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-2xl">
                {medication.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <h2 className="text-h2 font-semibold text-neutral-800 mb-2">
          Time for {medication.name}
        </h2>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="info" size="lg">
            {medication.dosage} {medication.form}
          </Badge>
        </div>

        {scheduledRecord && (
          <p className="text-body text-neutral-600">
            Scheduled for {formatTime(scheduledRecord.scheduledTime)}
          </p>
        )}
      </div>

      {/* Instructions */}
      {medication.instructions && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
          <h4 className="font-medium text-neutral-800 mb-2">Instructions:</h4>
          <p className="text-body text-neutral-600">{medication.instructions}</p>
        </div>
      )}

      {/* Encouraging Message */}
      <div className="mb-6 text-center">
        <p className="text-body-large font-medium text-success-600">
          {getEncouragingMessage()}
        </p>
        {streakData && streakData.currentStreak > 0 && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex">
              {Array.from({ length: Math.min(streakData.currentStreak, 7) }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-success-500 rounded-full mr-1"
                />
              ))}
              {streakData.currentStreak > 7 && (
                <span className="text-success-600 font-medium ml-1">
                  +{streakData.currentStreak - 7}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="default"
          size="lg"
          onClick={handleConfirmTaken}
          disabled={isConfirming || markAsTaken.isPending}
          className="w-full h-14 text-body-large font-semibold bg-green-600 hover:bg-green-700"
        >
          {isConfirming || markAsTaken.isPending ? 'Recording...' : 'I Took It! ✓'}
        </Button>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowSkipReasons(true)}
            className="flex-1"
          >
            Skip This Dose
          </Button>

          {onClose && (
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Remind Me Later
            </Button>
          )}
        </div>
      </div>

      {/* Timestamp Info */}
      <div className="mt-4 text-center">
        <p className="text-caption text-neutral-500">
          Recorded at {new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })}
        </p>
      </div>
    </Card>
  );
};

export default IntakeConfirmation;