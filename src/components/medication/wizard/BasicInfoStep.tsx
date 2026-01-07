import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui';
import { MedicationFormData } from '../AddMedicationWizard';

interface BasicInfoStepProps {
  formData: MedicationFormData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MedicationFormData>) => void;
}

// Common medication names for autocomplete
const COMMON_MEDICATIONS = [
  'Acetaminophen', 'Advil', 'Albuterol', 'Amlodipine', 'Amoxicillin',
  'Aspirin', 'Atorvastatin', 'Azithromycin', 'Benadryl', 'Claritin',
  'Dextromethorphan', 'Furosemide', 'Gabapentin', 'Hydrochlorothiazide',
  'Ibuprofen', 'Insulin', 'Levothyroxine', 'Lisinopril', 'Losartan',
  'Metformin', 'Metoprolol', 'Naproxen', 'Omeprazole', 'Prednisone',
  'Simvastatin', 'Tylenol', 'Vitamin B12', 'Vitamin C', 'Vitamin D3',
  'Warfarin', 'Zoloft'
];

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  errors,
  onUpdate,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (formData.name.length > 0) {
      const filtered = COMMON_MEDICATIONS.filter(med =>
        med.toLowerCase().includes(formData.name.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions

      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && formData.name !== filtered[0]);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [formData.name]);

  const handleMedicationNameChange = (value: string) => {
    onUpdate({ name: value });
  };

  const handleSuggestionClick = (suggestion: string) => {
    onUpdate({ name: suggestion });
    setShowSuggestions(false);
  };

  const handleDosageChange = (value: string) => {
    onUpdate({ dosage: value });
  };

  const handleFormChange = (value: string) => {
    onUpdate({ form: value as MedicationFormData['form'] });
  };

  const handleInstructionsChange = (value: string) => {
    onUpdate({ instructions: value });
  };

  const handleTotalPillsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdate({
      totalPills: numValue,
      remainingPills: Math.min(formData.remainingPills, numValue)
    });
  };

  const handleRemainingPillsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdate({ remainingPills: numValue });
  };

  const handleRefillReminderChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    onUpdate({ refillReminder: numValue });
  };

  return (
    <div className="space-y-6">
      {/* Medication Name with Autocomplete */}
      <div>
        <label className="block text-body font-medium text-neutral-700 mb-2">
          Medication Name *
        </label>
        <div className="relative">
          <Input
            value={formData.name}
            onChange={(e) => handleMedicationNameChange(e.target.value)}
            placeholder="e.g., Metformin, Lisinopril"
            onFocus={() => {
              if (filteredSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          {errors.name && (
            <p className="text-caption text-error-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2 text-left text-body hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dosage and Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body font-medium text-neutral-700 mb-2">
            Dosage *
          </label>
          <Input
            value={formData.dosage}
            onChange={(e) => handleDosageChange(e.target.value)}
            placeholder="e.g., 500mg, 10ml"
          />
          {errors.dosage && (
            <p className="text-caption text-error-600 mt-1">{errors.dosage}</p>
          )}
        </div>

        <div>
          <label className="block text-body font-medium text-neutral-700 mb-2">
            Form *
          </label>
          <select
            value={formData.form}
            onChange={(e) => handleFormChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-body bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          >
            <option value="tablet">Tablet</option>
            <option value="capsule">Capsule</option>
            <option value="liquid">Liquid</option>
            <option value="injection">Injection</option>
          </select>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-body font-medium text-neutral-700 mb-2">
          Special Instructions
        </label>
        <textarea
          value={formData.instructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="e.g., Take with food, Avoid dairy products"
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-body resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          rows={3}
        />
        <p className="text-caption text-neutral-500 mt-1">
          Optional: Add any special instructions for taking this medication
        </p>
      </div>

      {/* Pill Count Information */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <h3 className="text-h3 font-semibold text-neutral-800 mb-4">
          Pill Count & Refill Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-body font-medium text-neutral-700 mb-2">
              Total Pills *
            </label>
            <Input
              type="number"
              value={formData.totalPills.toString()}
              onChange={(e) => handleTotalPillsChange(e.target.value)}
              placeholder="30"
              min="1"
            />
            {errors.totalPills && (
              <p className="text-caption text-error-600 mt-1">{errors.totalPills}</p>
            )}
          </div>

          <div>
            <label className="block text-body font-medium text-neutral-700 mb-2">
              Pills Remaining *
            </label>
            <Input
              type="number"
              value={formData.remainingPills.toString()}
              onChange={(e) => handleRemainingPillsChange(e.target.value)}
              placeholder="30"
              min="0"
              max={formData.totalPills}
            />
            {errors.remainingPills && (
              <p className="text-caption text-error-600 mt-1">{errors.remainingPills}</p>
            )}
          </div>

          <div>
            <label className="block text-body font-medium text-neutral-700 mb-2">
              Refill Reminder (days) *
            </label>
            <Input
              type="number"
              value={formData.refillReminder.toString()}
              onChange={(e) => handleRefillReminderChange(e.target.value)}
              placeholder="7"
              min="1"
            />
            {errors.refillReminder && (
              <p className="text-caption text-error-600 mt-1">{errors.refillReminder}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-caption text-neutral-600">
            We'll remind you to refill when you have {formData.refillReminder} days of medication left.
          </p>
        </div>
      </div>

      {/* Start Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body font-medium text-neutral-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.startDate.toISOString().split('T')[0]}
            onChange={(e) => onUpdate({ startDate: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-body bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-body font-medium text-neutral-700 mb-2">
            End Date (Optional)
          </label>
          <input
            type="date"
            value={formData.endDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => {
              if (e.target.value) {
                onUpdate({ endDate: new Date(e.target.value) });
              } else {
                const { endDate, ...rest } = formData;
                onUpdate(rest);
              }
            }}
            min={formData.startDate.toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-body bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          />
          <p className="text-caption text-neutral-500 mt-1">
            Leave empty for ongoing medication
          </p>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 className="text-body font-semibold text-primary-800 mb-2">
          💡 Tips for accurate medication entry
        </h4>
        <ul className="text-caption text-primary-700 space-y-1">
          <li>• Use the exact name from your prescription bottle</li>
          <li>• Include the strength in the dosage (e.g., "500mg" not just "500")</li>
          <li>• Count your current pills to set the remaining amount accurately</li>
          <li>• Set refill reminders based on how long it takes to get refills</li>
        </ul>
      </div>
    </div>
  );
};

export default BasicInfoStep;