import React from 'react';
import { Medication } from '@/types';
import { Button, Badge } from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
      return <Badge variant="secondary" className="backdrop-blur-md bg-neutral-200/50">Inactive</Badge>;
    }

    if (medication.remainingPills <= medication.refillReminder) {
      return <Badge variant="warning" className="animate-pulse shadow-neon-amber">Refill Soon</Badge>;
    }

    if (medication.remainingPills === 0) {
      return <Badge variant="error" className="shadow-neon-red">Out of Stock</Badge>;
    }

    return null;
  };

  const nextDose = getNextDoseTime();
  const statusBadge = getStatusBadge();

  // Determine variant based on next dose proximity or status
  const cardVariant = medication.remainingPills === 0 ? 'alert' : (medication.isActive ? 'active' : 'default');

  return (
    <GlassCard
      variant={cardVariant}
      className={cn(
        'transition-all duration-300 relative group',
        {
          'p-4': size === 'compact',
          'p-6': size === 'standard',
          'p-8': size === 'expanded',
        },
        isSwipeActive && 'scale-95 opacity-80',
        className
      )}
      hoverEffect={showActions}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Glow Element for Active Cards */}
      {medication.isActive && (
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/30 transition-all duration-500" />
      )}

      <div className="flex items-start justify-between gap-4 relative z-10">
        {/* Medication Image - Neumorphic Container */}
        <div className="flex-shrink-0">
          {medication.pillImage ? (
            <div className="relative rounded-2xl overflow-hidden shadow-inner border border-white/10">
              <img
                src={medication.pillImage}
                alt={`${medication.name} pill`}
                className={cn(
                  'object-cover',
                  {
                    'w-14 h-14': size === 'compact',
                    'w-20 h-20': size === 'standard',
                    'w-24 h-24': size === 'expanded',
                  }
                )}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
            </div>

          ) : (
            <div
              className={cn(
                'bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]',
                {
                  'w-14 h-14': size === 'compact',
                  'w-20 h-20': size === 'standard',
                  'w-24 h-24': size === 'expanded',
                }
              )}
            >
              <span className="text-primary font-bold text-xl font-heading">
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
                  'font-bold text-foreground truncate font-heading tracking-tight',
                  {
                    'text-lg': size === 'compact',
                    'text-xl': size === 'standard',
                    'text-2xl': size === 'expanded',
                  }
                )}
              >
                {medication.name}
              </h3>
              <p
                className={cn(
                  'text-muted-foreground mt-1 font-medium',
                  {
                    'text-sm': size === 'compact',
                    'text-base': size === 'standard' || size === 'expanded',
                  }
                )}
              >
                {formatDosage()}
              </p>
            </div>

            {statusBadge && (
              <div className="flex-shrink-0 ml-2">
                {statusBadge}
              </div>
            )}
          </div>

          {/* Schedule Info */}
          {size !== 'compact' && (
            <div className="mt-4 space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              {nextDose && (
                <p className="text-base text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Next dose: <span className="font-bold text-primary font-heading tracking-wide text-lg">{nextDose}</span>
                </p>
              )}

              {medication.scheduleType === 'time-based' && medication.times && (
                <p className="text-sm text-muted-foreground pl-4">
                  {medication.times.length} time{medication.times.length !== 1 ? 's' : ''} daily
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          {size === 'expanded' && medication.instructions && (
            <div className="mt-4">
              <p className="text-base text-neutral-600 dark:text-neutral-300 italic">
                "{medication.instructions}"
              </p>
            </div>
          )}

          {/* Pills Remaining - Modern Progress Bar */}
          {size !== 'compact' && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                <span>Supply</span>
                <span className={cn(
                  "text-primary",
                  medication.remainingPills <= medication.refillReminder && "text-warning",
                  medication.remainingPills === 0 && "text-destructive"
                )}>
                  {medication.remainingPills} / {medication.totalPills}
                </span>
              </div>
              <div className="w-full bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, (medication.remainingPills / medication.totalPills) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    'h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]',
                    {
                      'bg-primary': medication.remainingPills > medication.refillReminder,
                      'bg-warning': medication.remainingPills <= medication.refillReminder && medication.remainingPills > 0,
                      'bg-destructive': medication.remainingPills === 0,
                    }
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Large Touch Targets */}
      {showActions && size !== 'compact' && (
        <div className="flex gap-3 mt-6 relative z-10">
          {onTaken && medication.isActive && (
            <Button
              variant="default"
              size="lg"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onTaken(medication.id); }}
              className="flex-1 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-base font-semibold"
            >
              Mark Taken
            </Button>
          )}

          {onEdit && (
            <Button
              variant="outline"
              size="lg"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onEdit(medication.id); }}
              className="flex-1 bg-white/50 dark:bg-black/50 hover:bg-white/80"
            >
              Edit
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default MedicationCard;