import React from 'react';
import { Input, Button } from '@/components/ui';
import { MedicationFormData } from '../AddMedicationWizard';
import { cn } from '@/utils/cn';

interface ScheduleStepProps {
  formData: MedicationFormData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MedicationFormData>) => void;
}

const COMMON_SCHEDULES = [
  { label: 'Once daily (morning)', times: ['08:00'] },
  { label: 'Once daily (evening)', times: ['20:00'] },
  { label: 'Twice daily', times: ['08:00', '20:00'] },
  { label: 'Three times daily', times: ['08:00', '14:00', '20:00'] },
  { label: 'Four times daily', times: ['08:00', '12:00', '16:00', '20:00'] },
];

const COMMON_INTERVALS = [
  { label: 'Every 4 hours', hours: 4 },
  { label: 'Every 6 hours', hours: 6 },
  { label: 'Every 8 hours', hours: 8 },
  { label: 'Every 12 hours', hours: 12 },
  { label: 'Every 24 hours', hours: 24 },
];

const ScheduleStep: React.FC<ScheduleStepProps> = ({
  formData,
  errors,
  onUpdate,
}) => {
  const handleScheduleTypeChange = (type: 'time-based' | 'interval-based') => {
    onUpdate({ scheduleType: type });
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    onUpdate({ times: newTimes });
  };

  const addTimeSlot = () => {
    const newTimes = [...formData.times, '08:00'];
    onUpdate({ times: newTimes });
  };

  const removeTimeSlot = (index: number) => {
    if (formData.times.length > 1) {
      const newTimes = formData.times.filter((_, i) => i !== index);
      onUpdate({ times: newTimes });
    }
  };

  const handleIntervalChange = (value: string) => {
    const numValue = parseInt(value) || 8;
    onUpdate({ interval: numValue });
  };

  const applyCommonSchedule = (times: string[]) => {
    onUpdate({ 
      scheduleType: 'time-based',
      times: [...times]
    });
  };

  const applyCommonInterval = (hours: number) => {
    onUpdate({ 
      scheduleType: 'interval-based',
      interval: hours
    });
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    if (hours === undefined || minutes === undefined) return time;
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Schedule Type Selection */}
      <div>
        <h3 className="text-h3 font-semibold text-neutral-800 mb-4">
          How would you like to schedule this medication?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleScheduleTypeChange('time-based')}
            className={cn(
              'p-4 border-2 rounded-lg text-left transition-all duration-200',
              formData.scheduleType === 'time-based'
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
                  formData.scheduleType === 'time-based'
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-neutral-300'
                )}
              >
                {formData.scheduleType === 'time-based' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-neutral-800 mb-1">
                  Specific Times
                </h4>
                <p className="text-body text-neutral-600">
                  Take at specific times each day (e.g., 8:00 AM, 8:00 PM)
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleScheduleTypeChange('interval-based')}
            className={cn(
              'p-4 border-2 rounded-lg text-left transition-all duration-200',
              formData.scheduleType === 'interval-based'
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
                  formData.scheduleType === 'interval-based'
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-neutral-300'
                )}
              >
                {formData.scheduleType === 'interval-based' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-neutral-800 mb-1">
                  Regular Intervals
                </h4>
                <p className="text-body text-neutral-600">
                  Take every X hours (e.g., every 8 hours)
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Time-based Schedule */}
      {formData.scheduleType === 'time-based' && (
        <div className="space-y-4">
          <h4 className="text-body font-semibold text-neutral-800">
            Daily Schedule
          </h4>

          {/* Common Schedule Presets */}
          <div>
            <p className="text-body text-neutral-600 mb-3">
              Quick presets (click to apply):
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SCHEDULES.map((schedule, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyCommonSchedule(schedule.times)}
                  className="px-3 py-2 text-caption bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  {schedule.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Times */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-body font-medium text-neutral-700">
                Times ({formData.times.length})
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addTimeSlot}
              >
                Add Time
              </Button>
            </div>

            <div className="space-y-3">
              {formData.times.map((time, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-body bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>
                  <div className="text-body text-neutral-600 min-w-20">
                    {formatTimeDisplay(time)}
                  </div>
                  {formData.times.length > 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {errors.times && (
              <p className="text-caption text-error-600 mt-2">
                {errors.times}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Interval-based Schedule */}
      {formData.scheduleType === 'interval-based' && (
        <div className="space-y-4">
          <h4 className="text-body font-semibold text-neutral-800">
            Interval Schedule
          </h4>

          {/* Common Interval Presets */}
          <div>
            <p className="text-body text-neutral-600 mb-3">
              Common intervals (click to apply):
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_INTERVALS.map((interval, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyCommonInterval(interval.hours)}
                  className="px-3 py-2 text-caption bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  {interval.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Interval */}
          <div className="max-w-xs">
            <Input
              label="Interval (hours)"
              type="number"
              value={formData.interval?.toString() || '8'}
              onChange={(e) => handleIntervalChange(e.target.value)}
              placeholder="8"
              min="1"
              max="24"
              {...(errors.interval ? { error: errors.interval } : {})}
            />
            <p className="text-caption text-neutral-500 mt-1">
              Take every {formData.interval || 8} hours
            </p>
          </div>
        </div>
      )}

      {/* Schedule Preview */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <h4 className="text-body font-semibold text-neutral-800 mb-3">
          📅 Schedule Preview
        </h4>
        
        {formData.scheduleType === 'time-based' ? (
          <div>
            <p className="text-body text-neutral-700 mb-2">
              You'll take <strong>{formData.name || 'this medication'}</strong> at:
            </p>
            <div className="flex flex-wrap gap-2">
              {formData.times.map((time, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-caption font-medium"
                >
                  {formatTimeDisplay(time)}
                </span>
              ))}
            </div>
            <p className="text-caption text-neutral-600 mt-2">
              {formData.times.length} dose{formData.times.length !== 1 ? 's' : ''} per day
            </p>
          </div>
        ) : (
          <div>
            <p className="text-body text-neutral-700 mb-2">
              You'll take <strong>{formData.name || 'this medication'}</strong> every{' '}
              <strong>{formData.interval || 8} hours</strong>
            </p>
            <p className="text-caption text-neutral-600">
              {Math.round(24 / (formData.interval || 8))} dose{Math.round(24 / (formData.interval || 8)) !== 1 ? 's' : ''} per day
            </p>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 className="text-body font-semibold text-primary-800 mb-2">
          💡 Scheduling Tips
        </h4>
        <ul className="text-caption text-primary-700 space-y-1">
          <li>• Choose times that fit your daily routine</li>
          <li>• Space doses evenly throughout the day when possible</li>
          <li>• Consider meal times if your medication needs to be taken with food</li>
          <li>• Set reminders at least 30 minutes before bedtime for evening doses</li>
        </ul>
      </div>
    </div>
  );
};

export default ScheduleStep;