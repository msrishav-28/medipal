import React from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { MedicationFormData } from '../AddMedicationWizard';

interface ReviewStepProps {
  formData: MedicationFormData;
  onEdit: (stepIndex: number) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onEdit,
}) => {
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    if (hours === undefined || minutes === undefined) return time;
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatSchedule = () => {
    if (formData.scheduleType === 'time-based') {
      return `${formData.times.length} time${formData.times.length !== 1 ? 's' : ''} daily: ${formData.times.map(formatTimeDisplay).join(', ')}`;
    } else {
      return `Every ${formData.interval} hours (${Math.round(24 / (formData.interval || 8))} times daily)`;
    }
  };

  const formatDateRange = () => {
    const startDate = formData.startDate.toLocaleDateString();
    if (formData.endDate) {
      const endDate = formData.endDate.toLocaleDateString();
      return `${startDate} - ${endDate}`;
    }
    return `${startDate} (ongoing)`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-h3 font-semibold text-neutral-800 mb-2">
          Review Your Medication
        </h3>
        <p className="text-body text-neutral-600">
          Please review all the details before saving. You can edit any section by clicking the "Edit" button.
        </p>
      </div>

      {/* Basic Information */}
      <Card className="p-4">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-body font-semibold text-neutral-800">
            Basic Information
          </h4>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(0)}
          >
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-caption text-neutral-500 mb-1">Medication Name</p>
            <p className="text-body font-medium text-neutral-800">{formData.name}</p>
          </div>

          <div>
            <p className="text-caption text-neutral-500 mb-1">Dosage & Form</p>
            <p className="text-body font-medium text-neutral-800">
              {formData.dosage} {formData.form}
            </p>
          </div>

          {formData.instructions && (
            <div className="md:col-span-2">
              <p className="text-caption text-neutral-500 mb-1">Instructions</p>
              <p className="text-body text-neutral-700">{formData.instructions}</p>
            </div>
          )}

          <div>
            <p className="text-caption text-neutral-500 mb-1">Duration</p>
            <p className="text-body text-neutral-700">{formatDateRange()}</p>
          </div>

          <div>
            <p className="text-caption text-neutral-500 mb-1">Pills</p>
            <p className="text-body text-neutral-700">
              {formData.remainingPills} of {formData.totalPills} remaining
            </p>
          </div>
        </div>
      </Card>

      {/* Schedule Information */}
      <Card className="p-4">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-body font-semibold text-neutral-800">
            Schedule
          </h4>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(1)}
          >
            Edit
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-caption text-neutral-500 mb-1">Schedule Type</p>
            <Badge variant="secondary">
              {formData.scheduleType === 'time-based' ? 'Specific Times' : 'Regular Intervals'}
            </Badge>
          </div>

          <div>
            <p className="text-caption text-neutral-500 mb-1">Schedule Details</p>
            <p className="text-body text-neutral-700">{formatSchedule()}</p>
          </div>

          {formData.scheduleType === 'time-based' && (
            <div>
              <p className="text-caption text-neutral-500 mb-2">Daily Times</p>
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
            </div>
          )}

          <div>
            <p className="text-caption text-neutral-500 mb-1">Refill Reminder</p>
            <p className="text-body text-neutral-700">
              {formData.refillReminder} days before running out
            </p>
          </div>
        </div>
      </Card>

      {/* Photo Information */}
      <Card className="p-4">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-body font-semibold text-neutral-800">
            Pill Photo
          </h4>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(2)}
          >
            Edit
          </Button>
        </div>

        {formData.pillImage ? (
          <div className="flex items-center gap-4">
            <img
              src={formData.pillImage}
              alt="Pill photo"
              className="w-16 h-16 object-cover rounded-lg border border-neutral-200"
            />
            <div>
              <p className="text-body text-neutral-700 mb-1">Photo added</p>
              <p className="text-caption text-neutral-500">
                This will help you identify your medication
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-neutral-400">📷</span>
            </div>
            <div>
              <p className="text-body text-neutral-700 mb-1">No photo added</p>
              <p className="text-caption text-neutral-500">
                You can add a photo later if needed
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Summary */}
      <div className="bg-success-50 border border-success-200 rounded-lg p-4">
        <h4 className="text-body font-semibold text-success-800 mb-3">
          🎉 Ready to Save!
        </h4>
        <div className="space-y-2 text-caption text-success-700">
          <p>
            • <strong>{formData.name}</strong> will be added to your medication list
          </p>
          <p>
            • You'll receive reminders based on your schedule: <strong>{formatSchedule()}</strong>
          </p>
          <p>
            • Refill reminders will start when you have <strong>{formData.refillReminder} days</strong> of medication left
          </p>
          {formData.instructions && (
            <p>
              • Special instructions: <strong>{formData.instructions}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Final Confirmation */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 className="text-body font-semibold text-primary-800 mb-2">
          📋 Before You Save
        </h4>
        <ul className="text-caption text-primary-700 space-y-1">
          <li>• Double-check the medication name and dosage</li>
          <li>• Verify the schedule matches your prescription</li>
          <li>• Make sure the pill count is accurate</li>
          <li>• Confirm the refill reminder timing works for you</li>
        </ul>
      </div>
    </div>
  );
};

export default ReviewStep;