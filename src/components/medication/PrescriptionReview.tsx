import React, { useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { ParsedPrescription } from '@/services/ocrService';
import { Medication } from '@/types';
import { cn } from '@/utils/cn';

interface PrescriptionReviewProps {
  parsedData: ParsedPrescription;
  originalImage: string;
  userId: string;
  onSave: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  onRescan: () => void;
  className?: string;
}

const PrescriptionReview: React.FC<PrescriptionReviewProps> = ({
  parsedData,
  originalImage,
  userId,
  onSave,
  onCancel,
  onRescan,
  className,
}) => {
  const [formData, setFormData] = useState({
    name: parsedData.medicationName || '',
    dosage: parsedData.dosage || '',
    form: parsedData.form || 'tablet' as ('tablet' | 'capsule' | 'liquid' | 'injection'),
    instructions: parsedData.instructions || '',
    totalPills: parsedData.quantity || 30,
    remainingPills: parsedData.quantity || 30,
    refillReminder: 7,
    scheduleType: 'time-based' as ('time-based' | 'interval-based'),
    times: ['08:00'],
    interval: 8,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData(prev => ({
      ...prev,
      times: newTimes,
    }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      times: [...prev.times, '08:00'],
    }));
  };

  const removeTimeSlot = (index: number) => {
    if (formData.times.length > 1) {
      const newTimes = formData.times.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        times: newTimes,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Medication name is required';
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Dosage is required';
    }

    if (formData.totalPills < 1) {
      newErrors.totalPills = 'Total pills must be at least 1';
    }

    if (formData.remainingPills < 0 || formData.remainingPills > formData.totalPills) {
      newErrors.remainingPills = 'Remaining pills must be between 0 and total pills';
    }

    if (formData.scheduleType === 'time-based') {
      if (!formData.times || formData.times.length === 0) {
        newErrors.times = 'At least one time is required';
      } else {
        const invalidTimes = formData.times.filter(time => !time || !/^\d{2}:\d{2}$/.test(time));
        if (invalidTimes.length > 0) {
          newErrors.times = 'All times must be in HH:MM format';
        }
      }
    } else if (formData.scheduleType === 'interval-based') {
      if (!formData.interval || formData.interval < 1 || formData.interval > 24) {
        newErrors.interval = 'Interval must be between 1 and 24 hours';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        form: formData.form,
        scheduleType: formData.scheduleType,
        ...(formData.scheduleType === 'time-based' ? { times: formData.times } : {}),
        ...(formData.scheduleType === 'interval-based' ? { interval: formData.interval } : {}),
        instructions: formData.instructions.trim(),
        ...(originalImage ? { pillImage: originalImage } : {}),
        startDate: new Date(),
        refillReminder: formData.refillReminder,
        totalPills: formData.totalPills,
        remainingPills: formData.remainingPills,
        isActive: true,
      };

      onSave(medicationData);
    }
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
    <div className={cn('prescription-review max-w-4xl mx-auto', className)}>
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-800 mb-2">
          Review Scanned Prescription
        </h1>
        <p className="text-body text-neutral-600">
          Please review and edit the information extracted from your prescription label
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Original Image */}
        <div>
          <h2 className="text-h2 font-semibold text-neutral-800 mb-4">
            Scanned Image
          </h2>
          <Card className="p-4">
            <img
              src={originalImage}
              alt="Scanned prescription"
              className="w-full max-h-80 object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={onRescan}
              >
                Scan Different Image
              </Button>
            </div>
          </Card>

          {/* OCR Confidence */}
          <Card className="p-4 mt-4">
            <h3 className="text-body font-semibold text-neutral-800 mb-2">
              Scan Quality
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      {
                        'bg-success-500': parsedData.confidence >= 80,
                        'bg-warning-500': parsedData.confidence >= 60 && parsedData.confidence < 80,
                        'bg-error-500': parsedData.confidence < 60,
                      }
                    )}
                    style={{ width: `${parsedData.confidence}%` }}
                  />
                </div>
              </div>
              <span className="text-body font-medium text-neutral-800">
                {Math.round(parsedData.confidence)}%
              </span>
            </div>
            {parsedData.confidence < 70 && (
              <p className="text-caption text-warning-600 mt-2">
                Low confidence scan. Please double-check all information below.
              </p>
            )}
          </Card>
        </div>

        {/* Editable Form */}
        <div>
          <h2 className="text-h2 font-semibold text-neutral-800 mb-4">
            Medication Information
          </h2>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="p-4">
              <h3 className="text-body font-semibold text-neutral-800 mb-4">
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <Input
                  label="Medication Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Metformin"
                  {...(errors.name ? { error: errors.name } : {})}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Dosage *"
                    value={formData.dosage}
                    onChange={(e) => handleInputChange('dosage', e.target.value)}
                    placeholder="e.g., 500mg"
                    {...(errors.dosage ? { error: errors.dosage } : {})}
                  />

                  <div>
                    <label className="block text-body font-medium text-neutral-700 mb-2">
                      Form *
                    </label>
                    <select
                      value={formData.form}
                      onChange={(e) => handleInputChange('form', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-body bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="liquid">Liquid</option>
                      <option value="injection">Injection</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-body font-medium text-neutral-700 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="e.g., Take with food"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-body resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={2}
                  />
                </div>
              </div>
            </Card>

            {/* Schedule */}
            <Card className="p-4">
              <h3 className="text-body font-semibold text-neutral-800 mb-4">
                Schedule
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-body font-medium text-neutral-700 mb-2">
                    Schedule Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="time-based"
                        checked={formData.scheduleType === 'time-based'}
                        onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                        className="mr-2"
                      />
                      Specific Times
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="interval-based"
                        checked={formData.scheduleType === 'interval-based'}
                        onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                        className="mr-2"
                      />
                      Interval
                    </label>
                  </div>
                </div>

                {formData.scheduleType === 'time-based' ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-body font-medium text-neutral-700">
                        Daily Times
                      </label>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addTimeSlot}
                      >
                        Add Time
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {formData.times.map((time, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => handleTimeChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-body bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <span className="text-body text-neutral-600 min-w-20">
                            {formatTimeDisplay(time)}
                          </span>
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
                ) : (
                  <Input
                    label="Interval (hours)"
                    type="number"
                    value={formData.interval.toString()}
                    onChange={(e) => handleInputChange('interval', parseInt(e.target.value) || 8)}
                    placeholder="8"
                    min="1"
                    max="24"
                    {...(errors.interval ? { error: errors.interval } : {})}
                  />
                )}
              </div>
            </Card>

            {/* Pill Count */}
            <Card className="p-4">
              <h3 className="text-body font-semibold text-neutral-800 mb-4">
                Pill Count
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Total Pills *"
                  type="number"
                  value={formData.totalPills.toString()}
                  onChange={(e) => handleInputChange('totalPills', parseInt(e.target.value) || 0)}
                  min="1"
                  {...(errors.totalPills ? { error: errors.totalPills } : {})}
                />

                <Input
                  label="Pills Remaining *"
                  type="number"
                  value={formData.remainingPills.toString()}
                  onChange={(e) => handleInputChange('remainingPills', parseInt(e.target.value) || 0)}
                  min="0"
                  max={formData.totalPills}
                  {...(errors.remainingPills ? { error: errors.remainingPills } : {})}
                />

                <Input
                  label="Refill Reminder (days)"
                  type="number"
                  value={formData.refillReminder.toString()}
                  onChange={(e) => handleInputChange('refillReminder', parseInt(e.target.value) || 7)}
                  min="1"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          className="flex-1"
        >
          Save Medication
        </Button>
      </div>
    </div>
  );
};

export default PrescriptionReview;