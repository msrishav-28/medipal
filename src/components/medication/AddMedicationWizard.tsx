import React, { useState } from 'react';
import { Medication } from '@/types';
import { Card, Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import BasicInfoStep from './wizard/BasicInfoStep';
import ScheduleStep from './wizard/ScheduleStep';
import PillPhotoStep from './wizard/PillPhotoStep';
import ReviewStep from './wizard/ReviewStep';

interface AddMedicationWizardProps {
  userId: string;
  onSave: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  className?: string;
}

export interface MedicationFormData {
  name: string;
  dosage: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection';
  scheduleType: 'time-based' | 'interval-based';
  times: string[];
  interval?: number;
  instructions: string;
  startDate: Date;
  endDate?: Date;
  refillReminder: number;
  totalPills: number;
  remainingPills: number;
  pillImage?: string;
}

const steps = [
  { id: 'basic', title: 'Basic Info', description: 'Medication name and dosage' },
  { id: 'schedule', title: 'Schedule', description: 'When to take it' },
  { id: 'photo', title: 'Photo', description: 'Add pill photo (optional)' },
  { id: 'review', title: 'Review', description: 'Confirm details' },
];

const AddMedicationWizard: React.FC<AddMedicationWizardProps> = ({
  userId,
  onSave,
  onCancel,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<MedicationFormData>(() => ({
    name: '',
    dosage: '',
    form: 'tablet' as const,
    scheduleType: 'time-based' as const,
    times: ['08:00'],
    interval: 8,
    instructions: '',
    startDate: new Date(),
    refillReminder: 7,
    totalPills: 30,
    remainingPills: 30,
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (updates: Partial<MedicationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear related errors when field is updated
    const updatedFields = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => {
        delete newErrors[field];
      });
      return newErrors;
    });
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 0: // Basic Info
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
        if (formData.refillReminder < 1) {
          newErrors.refillReminder = 'Refill reminder must be at least 1 day';
        }
        break;

      case 1: // Schedule
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
        break;

      case 2: // Photo (optional step, no validation required)
        break;

      case 3: // Review (final validation)
        // All validations done in previous steps
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSave();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (validateCurrentStep()) {
      const medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        form: formData.form,
        scheduleType: formData.scheduleType,
        ...(formData.scheduleType === 'time-based' && formData.times ? { times: formData.times } : {}),
        ...(formData.scheduleType === 'interval-based' && formData.interval ? { interval: formData.interval } : {}),
        instructions: formData.instructions.trim(),
        ...(formData.pillImage ? { pillImage: formData.pillImage } : {}),
        startDate: formData.startDate,
        ...(formData.endDate ? { endDate: formData.endDate } : {}),
        refillReminder: formData.refillReminder,
        totalPills: formData.totalPills,
        remainingPills: formData.remainingPills,
        isActive: true,
      };

      onSave(medicationData);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
          />
        );
      case 1:
        return (
          <ScheduleStep
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
          />
        );
      case 2:
        return (
          <PillPhotoStep
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
          />
        );
      case 3:
        return (
          <ReviewStep
            formData={formData}
            onEdit={(stepIndex) => setCurrentStep(stepIndex)}
          />
        );
      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  if (!currentStepData) {
    return null; // Should never happen with controlled currentStep
  }

  return (
    <div className={cn('add-medication-wizard max-w-2xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-800 mb-2">
          Add New Medication
        </h1>
        <p className="text-body text-neutral-600">
          Let's set up your medication schedule step by step
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center',
                index < steps.length - 1 && 'flex-1'
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  {
                    'bg-primary-500 text-white': index === currentStep,
                    'bg-success-500 text-white': index < currentStep,
                    'bg-neutral-200 text-neutral-500': index > currentStep,
                  }
                )}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>

              {/* Step Info */}
              <div className="ml-3 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    {
                      'text-primary-600': index === currentStep,
                      'text-success-600': index < currentStep,
                      'text-neutral-500': index > currentStep,
                    }
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-neutral-500">{step.description}</p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 mx-4 transition-colors',
                    {
                      'bg-success-500': index < currentStep,
                      'bg-neutral-200': index >= currentStep,
                    }
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-8">
        <div className="mb-6">
          <h2 className="text-h2 font-semibold text-neutral-800 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-body text-neutral-600">
            {currentStepData.description}
          </p>
        </div>

        {renderStepContent()}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="default"
          onClick={onCancel}
          className="flex-1 order-2 sm:order-1"
        >
          Cancel
        </Button>

        <div className="flex gap-3 flex-1 order-1 sm:order-2">
          {currentStep > 0 && (
            <Button
              variant="secondary"
              size="default"
              onClick={handlePrevious}
              className="flex-1"
            >
              Previous
            </Button>
          )}

          <Button
            variant="default"
            size="default"
            onClick={handleNext}
            className="flex-1"
          >
            {isLastStep ? 'Save Medication' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddMedicationWizard;