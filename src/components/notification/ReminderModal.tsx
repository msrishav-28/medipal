import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { VoiceControl } from './VoiceControl';
import { useBreakpoint, useNotifications, useVoice } from '@/hooks';
import { MedicationReminder } from '@/types';

interface ReminderModalProps {
  reminder: MedicationReminder;
  isOpen: boolean;
  onTaken: () => void;
  onSnooze: (minutes: number) => void;
  onSkip: (reason?: string) => void;
  onClose: () => void;
}

const SNOOZE_OPTIONS = [5, 10, 15]; // minutes
const SKIP_REASONS = [
  'Already took it',
  'Feeling unwell',
  'Ran out of medication',
  'Doctor advised to skip',
  'Other'
];

export function ReminderModal({
  reminder,
  isOpen,
  onTaken,
  onSnooze,
  onSkip,
  onClose
}: ReminderModalProps) {
  const { isMobile } = useBreakpoint();
  const { settings } = useNotifications();
  const { speakConfirmation } = useVoice();
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [showSkipOptions, setShowSkipOptions] = useState(false);
  const [selectedSkipReason, setSelectedSkipReason] = useState('');
  const [customSkipReason, setCustomSkipReason] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Auto-dismiss after 5 minutes if no action taken
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      handleSkip('No response - auto-skipped');
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Countdown timer for snooze
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleTaken = async () => {
    onTaken();
    try {
      await speakConfirmation(reminder.medicationName, 'taken');
    } catch (error) {
      console.warn('Failed to speak confirmation:', error);
    }
    onClose();
  };

  const handleSnooze = async (minutes: number) => {
    if (reminder.snoozeCount >= settings.maxSnoozes) {
      alert(`Maximum snooze limit (${settings.maxSnoozes}) reached. Please take your medication or skip this dose.`);
      return;
    }

    onSnooze(minutes);
    try {
      await speakConfirmation(reminder.medicationName, 'snoozed');
    } catch (error) {
      console.warn('Failed to speak confirmation:', error);
    }
    setCountdown(minutes * 60); // Convert to seconds
    setShowSnoozeOptions(false);
    onClose();
  };

  const handleSkip = async (reason?: string) => {
    const finalReason = reason || 
      (selectedSkipReason === 'Other' ? customSkipReason : selectedSkipReason);
    onSkip(finalReason);
    try {
      await speakConfirmation(reminder.medicationName, 'skipped');
    } catch (error) {
      console.warn('Failed to speak confirmation:', error);
    }
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Full-screen modal for mobile, centered modal for desktop
  const modalClasses = isMobile
    ? 'fixed inset-0 z-50 bg-white'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';

  const contentClasses = isMobile
    ? 'h-full flex flex-col'
    : 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4';

  return (
    <div className={modalClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className={`${isMobile ? 'p-6 pb-4' : 'p-6'} border-b border-neutral-200`}>
          <div className="flex items-center justify-between">
            <h2 className="text-h2 text-neutral-800">Medication Reminder</h2>
            {!isMobile && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-body text-neutral-600 mt-1">
            Scheduled for {formatTime(reminder.scheduledTime)}
          </p>
        </div>

        {/* Content */}
        <div className={`${isMobile ? 'flex-1 p-6' : 'p-6'} space-y-6`}>
          {/* Medication Info */}
          <div className="text-center">
            {reminder.pillImage && (
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
                <img
                  src={reminder.pillImage}
                  alt={reminder.medicationName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className="text-h3 text-neutral-800 mb-2">{reminder.medicationName}</h3>
            <p className="text-body-large text-neutral-600 mb-2">{reminder.dosage}</p>
            {reminder.instructions && (
              <p className="text-body text-neutral-500">{reminder.instructions}</p>
            )}
            
            {/* Voice Control */}
            <VoiceControl
              text={`It's time to take your medication. ${reminder.medicationName}, ${reminder.dosage}. ${reminder.instructions || ''}`}
              autoPlay={true}
              className="justify-center"
            />
          </div>

          {/* Snooze count warning */}
          {reminder.snoozeCount > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <p className="text-sm text-warning-700">
                This reminder has been snoozed {reminder.snoozeCount} time{reminder.snoozeCount > 1 ? 's' : ''}.
                {reminder.snoozeCount >= settings.maxSnoozes && (
                  <span className="font-medium"> Maximum snoozes reached.</span>
                )}
              </p>
            </div>
          )}

          {/* Countdown display */}
          {countdown !== null && countdown > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-center">
              <p className="text-sm text-primary-700 mb-2">Next reminder in:</p>
              <p className="text-h3 text-primary-800 font-mono">{formatCountdown(countdown)}</p>
            </div>
          )}

          {/* Snooze Options */}
          {showSnoozeOptions && (
            <Card className="p-4 bg-neutral-50">
              <h4 className="text-h4 mb-3">Snooze for:</h4>
              <div className="grid grid-cols-3 gap-2">
                {SNOOZE_OPTIONS.map((minutes) => (
                  <Button
                    key={minutes}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSnooze(minutes)}
                    className="text-sm"
                  >
                    {minutes} min
                  </Button>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSnoozeOptions(false)}
                className="w-full mt-3"
              >
                Cancel
              </Button>
            </Card>
          )}

          {/* Skip Options */}
          {showSkipOptions && (
            <Card className="p-4 bg-neutral-50">
              <h4 className="text-h4 mb-3">Reason for skipping:</h4>
              <div className="space-y-2">
                {SKIP_REASONS.map((reason) => (
                  <label key={reason} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="skipReason"
                      value={reason}
                      checked={selectedSkipReason === reason}
                      onChange={(e) => setSelectedSkipReason(e.target.value)}
                      className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-body text-neutral-700">{reason}</span>
                  </label>
                ))}
              </div>
              
              {selectedSkipReason === 'Other' && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Please specify..."
                    value={customSkipReason}
                    onChange={(e) => setCustomSkipReason(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSkipOptions(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleSkip()}
                  disabled={!selectedSkipReason || (selectedSkipReason === 'Other' && !customSkipReason.trim())}
                  className="flex-1"
                >
                  Skip Dose
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className={`${isMobile ? 'p-6 pt-4' : 'p-6'} border-t border-neutral-200`}>
          <div className="space-y-3">
            {/* Primary Action - I took it */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleTaken}
              className="w-full bg-success-600 hover:bg-success-700 text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              I took it
            </Button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                disabled={reminder.snoozeCount >= settings.maxSnoozes}
                className="flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Snooze
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => setShowSkipOptions(!showSkipOptions)}
                className="flex items-center justify-center text-neutral-600 hover:text-neutral-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Skip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
