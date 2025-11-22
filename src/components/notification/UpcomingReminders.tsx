import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { MedicationReminder } from '@/types';
import { useBreakpoint } from '@/hooks';

interface UpcomingRemindersProps {
  reminders: MedicationReminder[];
  onReminderClick?: (reminder: MedicationReminder) => void;
  className?: string;
}

export function UpcomingReminders({
  reminders,
  onReminderClick,
  className = ''
}: UpcomingRemindersProps) {
  const { isMobile } = useBreakpoint();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeUntil = (scheduledTime: Date) => {
    const now = currentTime;
    const diff = scheduledTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Now';
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getTimeStatus = (scheduledTime: Date) => {
    const now = currentTime;
    const diff = scheduledTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'overdue';
    } else if (diff <= 15 * 60 * 1000) { // 15 minutes
      return 'soon';
    } else if (diff <= 60 * 60 * 1000) { // 1 hour
      return 'upcoming';
    } else {
      return 'scheduled';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-error-600 bg-error-50 border-error-200';
      case 'soon':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'upcoming':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const sortedReminders = [...reminders].sort((a, b) => 
    a.scheduledTime.getTime() - b.scheduledTime.getTime()
  );

  if (reminders.length === 0) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-h3 text-neutral-600 mb-2">No Upcoming Reminders</h3>
        <p className="text-body text-neutral-500">
          You're all caught up! Your next medication reminders will appear here.
        </p>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-h3 text-neutral-800">Upcoming Reminders</h3>
        <p className="text-body text-neutral-600 mt-1">
          {reminders.length} reminder{reminders.length > 1 ? 's' : ''} scheduled
        </p>
      </div>

      <div className="divide-y divide-neutral-200">
        {sortedReminders.slice(0, isMobile ? 3 : 5).map((reminder) => {
          const status = getTimeStatus(reminder.scheduledTime);
          const statusColors = getStatusColor(status);

          return (
            <div
              key={reminder.id}
              className={`p-4 hover:bg-neutral-50 transition-colors ${
                onReminderClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onReminderClick?.(reminder)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {reminder.pillImage ? (
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={reminder.pillImage}
                          alt={reminder.medicationName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                        </svg>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-body font-medium text-neutral-800 truncate">
                        {reminder.medicationName}
                      </h4>
                      <p className="text-sm text-neutral-600">{reminder.dosage}</p>
                      {reminder.snoozeCount > 0 && (
                        <p className="text-xs text-warning-600">
                          Snoozed {reminder.snoozeCount} time{reminder.snoozeCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 ml-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors}`}>
                    {formatTimeUntil(reminder.scheduledTime)}
                  </div>
                  <p className="text-xs text-neutral-500">
                    {formatTime(reminder.scheduledTime)}
                  </p>
                </div>
              </div>

              {reminder.instructions && (
                <p className="text-sm text-neutral-500 mt-2 ml-13">
                  {reminder.instructions}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {reminders.length > (isMobile ? 3 : 5) && (
        <div className="p-4 border-t border-neutral-200">
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-primary-600 hover:text-primary-700"
          >
            View all {reminders.length} reminders
          </Button>
        </div>
      )}
    </Card>
  );
}
