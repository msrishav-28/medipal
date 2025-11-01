import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';

interface SnoozeCountdownProps {
  endTime: Date;
  medicationName: string;
  onTimeUp?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function SnoozeCountdown({
  endTime,
  medicationName,
  onTimeUp,
  onCancel,
  className = ''
}: SnoozeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const difference = end - now;
      
      if (difference <= 0) {
        setTimeLeft(0);
        setIsActive(false);
        onTimeUp?.();
        return 0;
      }
      
      return Math.floor(difference / 1000); // Convert to seconds
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalDuration = 15 * 60; // Assume 15 minutes max snooze
    const elapsed = totalDuration - timeLeft;
    return Math.min((elapsed / totalDuration) * 100, 100);
  };

  const getProgressColor = () => {
    if (timeLeft <= 60) return 'bg-error-500'; // Last minute - red
    if (timeLeft <= 300) return 'bg-warning-500'; // Last 5 minutes - orange
    return 'bg-primary-500'; // Normal - blue
  };

  if (!isActive || timeLeft <= 0) {
    return null;
  }

  return (
    <Card className={`p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h4 className="text-body font-medium text-primary-800">
                Snoozed: {medicationName}
              </h4>
              <p className="text-sm text-primary-600">
                Reminder in {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 bg-primary-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {onCancel && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            className="ml-3 text-primary-600 hover:text-primary-700 hover:bg-primary-200"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Pulsing animation for urgency */}
      {timeLeft <= 60 && (
        <div className="mt-3 flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 bg-error-500 rounded-full"></div>
          <p className="text-sm font-medium text-error-600">
            Reminder due in less than 1 minute!
          </p>
        </div>
      )}
    </Card>
  );
}
