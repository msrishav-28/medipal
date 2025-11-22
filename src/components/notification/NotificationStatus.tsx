import { Card } from '@/components/ui';
import { useNotifications } from '@/hooks';

interface NotificationStatusProps {
  className?: string;
  compact?: boolean;
}

export function NotificationStatus({ className = '', compact = false }: NotificationStatusProps) {
  const { permissionState, settings, isInitialized, error } = useNotifications();

  if (!isInitialized) {
    return (
      <Card className={`p-3 bg-neutral-50 border-neutral-200 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-neutral-300 rounded-full animate-pulse"></div>
          <span className="text-sm text-neutral-600">Initializing notifications...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-3 bg-error-50 border-error-200 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-error-500 rounded-full"></div>
          <span className="text-sm text-error-700">Notification error</span>
          {!compact && <span className="text-xs text-error-600">: {error}</span>}
        </div>
      </Card>
    );
  }

  const getStatusInfo = () => {
    if (!permissionState.granted) {
      return {
        color: 'warning',
        icon: '⚠️',
        text: 'Notifications disabled',
        description: 'Enable to receive reminders'
      };
    }

    if (!settings.enabled) {
      return {
        color: 'neutral',
        icon: '🔕',
        text: 'Notifications muted',
        description: 'Reminders are turned off'
      };
    }

    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);
      
      if (startHour === undefined || startMin === undefined || endHour === undefined || endMin === undefined) {
        return null; // Invalid time format
      }
      
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      const isQuietTime = startTime <= endTime
        ? currentTime >= startTime && currentTime <= endTime
        : currentTime >= startTime || currentTime <= endTime;

      if (isQuietTime) {
        return {
          color: 'info',
          icon: '🌙',
          text: 'Quiet hours active',
          description: `Until ${settings.quietHours.end}`
        };
      }
    }

    return {
      color: 'success',
      icon: '🔔',
      text: 'Notifications active',
      description: 'Reminders enabled'
    };
  };

  const status = getStatusInfo();

  if (!status) {
    return null; // Return null if status couldn't be determined
  }

  const colorClasses: Record<string, string> = {
    success: 'bg-success-50 border-success-200 text-success-700',
    warning: 'bg-warning-50 border-warning-200 text-warning-700',
    error: 'bg-error-50 border-error-200 text-error-700',
    info: 'bg-info-50 border-info-200 text-info-700',
    neutral: 'bg-neutral-50 border-neutral-200 text-neutral-700'
  };

  const dotClasses: Record<string, string> = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    info: 'bg-info-500',
    neutral: 'bg-neutral-500'
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-3 h-3 rounded-full ${dotClasses[status.color]}`}></div>
        <span className="text-sm font-medium">{status.text}</span>
      </div>
    );
  }

  return (
    <Card className={`p-3 ${colorClasses[status.color]} ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-lg">{status.icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{status.text}</p>
          <p className="text-xs opacity-80">{status.description}</p>
        </div>
        
        {/* Additional status indicators */}
        <div className="flex gap-1">
          {settings.sound && (
            <div className="w-2 h-2 bg-current rounded-full opacity-60" title="Sound enabled"></div>
          )}
          {settings.vibration && (
            <div className="w-2 h-2 bg-current rounded-full opacity-60" title="Vibration enabled"></div>
          )}
        </div>
      </div>
    </Card>
  );
}