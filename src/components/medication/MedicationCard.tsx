import React from 'react';
import { Medication } from '@/types';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/utils/cn';

interface MedicationCardProps {
  medication: Medication;
  size?: 'compact' | 'standard' | 'expanded';
  showActions?: boolean;
  onTaken?: (id: string) => void;
  onEdit?: (id: string) => void;
  onSwipeLeft?: (id: string) => void;
  onSwipeRight?: (id: string) => void;
  className?: string;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  size = 'standard',
  showActions = true,
  onTaken,
  onEdit,
  onSwipeLeft,
  onSwipeRight,
  className,
}) => {
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const [isSwipeActive, setIsSwipeActive] = React.useState(false);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (!touch) return;
    setTouchEnd(null);
    setTouchStart(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (!touch) return;
    setTouchEnd(touch.clientX);
    
    if (!touchStart) return;
    
    const distance = touchStart - touch.clientX;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    
    setIsSwipeActive(isSwipe);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft(medication.id);
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight(medication.id);
    }

    setIsSwipeActive(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const getNextDoseTime = () => {
    if (!medication.times || medication.times.length === 0) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const time of medication.times) {
      const parts = time.split(':').map(Number);
      const hours = parts[0];
      const minutes = parts[1];
      
      if (hours === undefined || minutes === undefined) continue;
      
      const timeInMinutes = hours * 60 + minutes;
      
      if (timeInMinutes > currentTime) {
        return time;
      }
    }
    
    // If no time today, return first time tomorrow
    return medication.times[0];
  };

  const formatDosage = () => {
    return `${medication.dosage} ${medication.form}`;
  };

  const getStatusBadge = () => {
    if (!medication.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (medication.remainingPills <= medication.refillReminder) {
      return <Badge variant="warning">Refill Soon</Badge>;
    }
    
    if (medication.remainingPills === 0) {
      return <Badge variant="error">Out of Stock</Badge>;
    }
    
    return null;
  };

  const nextDose = getNextDoseTime();
  const statusBadge = getStatusBadge();

  const cardClasses = cn(
    'medication-card transition-transform duration-200',
    {
      'p-3': size === 'compact',
      'p-4': size === 'standard',
      'p-6': size === 'expanded',
    },
    isSwipeActive && 'scale-95',
    className
  );

  return (
    <Card
      className={cardClasses}
      hover={showActions}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Medication Image */}
        <div className="flex-shrink-0">
          {medication.pillImage ? (
            <img
              src={medication.pillImage}
              alt={`${medication.name} pill`}
              className={cn(
                'rounded-lg object-cover',
                {
                  'w-12 h-12': size === 'compact',
                  'w-16 h-16': size === 'standard',
                  'w-20 h-20': size === 'expanded',
                }
              )}
            />
          ) : (
            <div
              className={cn(
                'bg-primary-100 rounded-lg flex items-center justify-center',
                {
                  'w-12 h-12': size === 'compact',
                  'w-16 h-16': size === 'standard',
                  'w-20 h-20': size === 'expanded',
                }
              )}
            >
              <span className="text-primary-600 font-semibold text-lg">
                {medication.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Medication Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  'font-semibold text-neutral-800 truncate',
                  {
                    'text-body': size === 'compact',
                    'text-body-large': size === 'standard',
                    'text-h3': size === 'expanded',
                  }
                )}
              >
                {medication.name}
              </h3>
              <p
                className={cn(
                  'text-neutral-600 mt-1',
                  {
                    'text-caption': size === 'compact',
                    'text-body': size === 'standard' || size === 'expanded',
                  }
                )}
              >
                {formatDosage()}
              </p>
            </div>
            
            {statusBadge && (
              <div className="flex-shrink-0">
                {statusBadge}
              </div>
            )}
          </div>

          {/* Schedule Info */}
          {size !== 'compact' && (
            <div className="mt-3 space-y-1">
              {nextDose && (
                <p className="text-body text-neutral-600">
                  Next dose: <span className="font-medium text-neutral-800">{nextDose}</span>
                </p>
              )}
              
              {medication.scheduleType === 'time-based' && medication.times && (
                <p className="text-caption text-neutral-500">
                  {medication.times.length} time{medication.times.length !== 1 ? 's' : ''} daily
                </p>
              )}
              
              {medication.scheduleType === 'interval-based' && medication.interval && (
                <p className="text-caption text-neutral-500">
                  Every {medication.interval} hours
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          {size === 'expanded' && medication.instructions && (
            <div className="mt-3">
              <p className="text-body text-neutral-600">
                {medication.instructions}
              </p>
            </div>
          )}

          {/* Pills Remaining */}
          {size !== 'compact' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-caption text-neutral-500">
                <span>Pills remaining</span>
                <span className="font-medium">
                  {medication.remainingPills} / {medication.totalPills}
                </span>
              </div>
              <div className="mt-1 w-full bg-neutral-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    {
                      'bg-success-500': medication.remainingPills > medication.refillReminder,
                      'bg-warning-500': medication.remainingPills <= medication.refillReminder && medication.remainingPills > 0,
                      'bg-error-500': medication.remainingPills === 0,
                    }
                  )}
                  style={{
                    width: `${Math.max(0, (medication.remainingPills / medication.totalPills) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && size !== 'compact' && (
        <div className="flex gap-2 mt-4">
          {onTaken && medication.isActive && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onTaken(medication.id)}
              className="flex-1"
            >
              Mark as Taken
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(medication.id)}
              className="flex-1"
            >
              Edit
            </Button>
          )}
        </div>
      )}

      {/* Swipe Hint for Mobile */}
      {(onSwipeLeft || onSwipeRight) && size !== 'compact' && (
        <div className="mt-2 text-center">
          <p className="text-caption text-neutral-400">
            Swipe left for options, right to mark taken
          </p>
        </div>
      )}
    </Card>
  );
};

export default MedicationCard;