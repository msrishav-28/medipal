import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MedicationReminder } from '@/types';
import { useBreakpoint } from '@/hooks';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists or src/utils/cn

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
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
        return 'text-red-500 border-red-500/50 bg-red-500/10';
      case 'soon':
        return 'text-amber-500 border-amber-500/50 bg-amber-500/10';
      case 'upcoming':
        return 'text-primary border-primary/50 bg-primary/10';
      default:
        return 'text-muted-foreground border-white/10 bg-white/5';
    }
  };

  const sortedReminders = [...reminders].sort((a, b) =>
    a.scheduledTime.getTime() - b.scheduledTime.getTime()
  );

  if (reminders.length === 0) {
    return (
      <GlassCard className={`p-8 text-center flex flex-col items-center justify-center min-h-[200px] ${className}`}>
        <div className="w-16 h-16 mb-4 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Upcoming Reminders</h3>
        <p className="text-muted-foreground max-w-xs">
          You're all caught up! Your next medication reminders will appear here.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn("p-0 overflow-hidden", className)}>
      <div className="p-6 border-b border-white/10">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Upcoming Reminders
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {reminders.length} reminder{reminders.length > 1 ? 's' : ''} scheduled
        </p>
      </div>

      <div className="divide-y divide-white/10">
        {sortedReminders.slice(0, isMobile ? 3 : 5).map((reminder) => {
          const status = getTimeStatus(reminder.scheduledTime);
          const statusColors = getStatusColor(status);

          return (
            <div
              key={reminder.id}
              className={`p-4 hover:bg-white/5 transition-colors ${onReminderClick ? 'cursor-pointer' : ''
                }`}
              onClick={() => onReminderClick?.(reminder)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    {reminder.pillImage ? (
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                        <img
                          src={reminder.pillImage}
                          alt={reminder.medicationName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/10 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
                        <span className="text-lg font-bold text-primary">
                          {reminder.medicationName.charAt(0)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-foreground truncate">
                        {reminder.medicationName}
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{reminder.dosage}</p>
                        {reminder.snoozeCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                            Snoozed {reminder.snoozeCount}x
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border", statusColors)}>
                    {formatTimeUntil(reminder.scheduledTime)}
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">
                    {formatTime(reminder.scheduledTime)}
                  </p>
                </div>
              </div>

              {reminder.instructions && (
                <div className="flex items-center gap-1.5 mt-2 ml-16 text-xs text-muted-foreground bg-white/5 py-1 px-2 rounded w-fit">
                  <AlertCircle className="w-3 h-3" />
                  {reminder.instructions}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reminders.length > (isMobile ? 3 : 5) && (
        <div className="p-4 bg-black/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary hover:text-primary hover:bg-primary/10"
          >
            View all {reminders.length} reminders
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
