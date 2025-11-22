import React, { useState } from 'react';
import { Medication } from '@/types';
import { Card, Button, Badge, Input } from '@/components/ui';
import { cn } from '@/utils/cn';

interface MedicationDetailProps {
  medication: Medication;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: (updates: Partial<Medication>) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onDeactivate?: () => void;
  onActivate?: () => void;
  className?: string;
}

const MedicationDetail: React.FC<MedicationDetailProps> = ({
  medication,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDeactivate,
  onActivate,
  className,
}) => {
  const [editForm, setEditForm] = useState({
    name: medication.name,
    dosage: medication.dosage,
    form: medication.form,
    instructions: medication.instructions || '',
    times: medication.times || [],
    interval: medication.interval || 0,
    scheduleType: medication.scheduleType,
    refillReminder: medication.refillReminder,
    totalPills: medication.totalPills,
    remainingPills: medication.remainingPills,
  });

  const handleInputChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...editForm.times];
    newTimes[index] = value;
    setEditForm(prev => ({
      ...prev,
      times: newTimes,
    }));
  };

  const addTimeSlot = () => {
    setEditForm(prev => ({
      ...prev,
      times: [...prev.times, '08:00'],
    }));
  };

  const removeTimeSlot = (index: number) => {
    const newTimes = editForm.times.filter((_, i) => i !== index);
    setEditForm(prev => ({
      ...prev,
      times: newTimes,
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editForm);
    }
  };

  const formatSchedule = () => {
    if (medication.scheduleType === 'time-based' && medication.times) {
      return `${medication.times.length} time${medication.times.length !== 1 ? 's' : ''} daily: ${medication.times.join(', ')}`;
    }
    if (medication.scheduleType === 'interval-based' && medication.interval) {
      return `Every ${medication.interval} hours`;
    }
    return 'No schedule set';
  };

  const getStatusInfo = () => {
    if (!medication.isActive) {
      return { text: 'Inactive', variant: 'secondary' as const };
    }
    if (medication.remainingPills === 0) {
      return { text: 'Out of Stock', variant: 'error' as const };
    }
    if (medication.remainingPills <= medication.refillReminder) {
      return { text: 'Refill Soon', variant: 'warning' as const };
    }
    return { text: 'Active', variant: 'success' as const };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={cn('medication-detail', className)}>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            {/* Medication Image */}
            <div className="flex-shrink-0">
              {medication.pillImage ? (
                <img
                  src={medication.pillImage}
                  alt={`${medication.name} pill`}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-2xl">
                    {medication.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    label="Medication Name"
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter medication name"
                  />
                  <div className="flex gap-3">
                    <Input
                      label="Dosage"
                      value={editForm.dosage}
                      onChange={(e) => handleInputChange('dosage', e.target.value)}
                      placeholder="e.g., 500mg"
                      className="flex-1"
                    />
                    <div className="flex-1">
                      <label className="block text-body font-medium text-neutral-700 mb-2">
                        Form
                      </label>
                      <select
                        value={editForm.form}
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
                </div>
              ) : (
                <>
                  <h1 className="text-h1 font-bold text-neutral-800 mb-2">
                    {medication.name}
                  </h1>
                  <p className="text-body-large text-neutral-600 mb-3">
                    {medication.dosage} {medication.form}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <Badge variant={statusInfo.variant}>
            {statusInfo.text}
          </Badge>
        </div>

        {/* Schedule Section */}
        <div className="mb-6">
          <h3 className="text-h3 font-semibold text-neutral-800 mb-3">
            Schedule
          </h3>
          
          {isEditing ? (
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
                      checked={editForm.scheduleType === 'time-based'}
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
                      checked={editForm.scheduleType === 'interval-based'}
                      onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                      className="mr-2"
                    />
                    Interval
                  </label>
                </div>
              </div>

              {editForm.scheduleType === 'time-based' && (
                <div>
                  <label className="block text-body font-medium text-neutral-700 mb-2">
                    Daily Times
                  </label>
                  <div className="space-y-2">
                    {editForm.times.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          className="flex-1"
                        />
                        {editForm.times.length > 1 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => removeTimeSlot(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={addTimeSlot}
                    >
                      Add Time
                    </Button>
                  </div>
                </div>
              )}

              {editForm.scheduleType === 'interval-based' && (
                <Input
                  label="Interval (hours)"
                  type="number"
                  value={editForm.interval}
                  onChange={(e) => handleInputChange('interval', parseInt(e.target.value))}
                  placeholder="e.g., 8"
                  min="1"
                  max="24"
                />
              )}
            </div>
          ) : (
            <Card className="p-4 bg-neutral-50">
              <p className="text-body text-neutral-700">
                {formatSchedule()}
              </p>
            </Card>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h3 className="text-h3 font-semibold text-neutral-800 mb-3">
            Instructions
          </h3>
          
          {isEditing ? (
            <textarea
              value={editForm.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Enter any special instructions..."
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-body resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          ) : (
            <Card className="p-4 bg-neutral-50">
              <p className="text-body text-neutral-700">
                {medication.instructions || 'No special instructions'}
              </p>
            </Card>
          )}
        </div>

        {/* Pill Count */}
        <div className="mb-6">
          <h3 className="text-h3 font-semibold text-neutral-800 mb-3">
            Pill Count
          </h3>
          
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Total Pills"
                type="number"
                value={editForm.totalPills}
                onChange={(e) => handleInputChange('totalPills', parseInt(e.target.value))}
                min="1"
              />
              <Input
                label="Remaining Pills"
                type="number"
                value={editForm.remainingPills}
                onChange={(e) => handleInputChange('remainingPills', parseInt(e.target.value))}
                min="0"
                max={editForm.totalPills}
              />
              <Input
                label="Refill Reminder (days)"
                type="number"
                value={editForm.refillReminder}
                onChange={(e) => handleInputChange('refillReminder', parseInt(e.target.value))}
                min="1"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-neutral-50">
                <p className="text-caption text-neutral-500 mb-1">Total Pills</p>
                <p className="text-body-large font-semibold text-neutral-800">
                  {medication.totalPills}
                </p>
              </Card>
              <Card className="p-4 bg-neutral-50">
                <p className="text-caption text-neutral-500 mb-1">Remaining</p>
                <p className="text-body-large font-semibold text-neutral-800">
                  {medication.remainingPills}
                </p>
              </Card>
              <Card className="p-4 bg-neutral-50">
                <p className="text-caption text-neutral-500 mb-1">Refill Alert</p>
                <p className="text-body-large font-semibold text-neutral-800">
                  {medication.refillReminder} days
                </p>
              </Card>
            </div>
          )}

          {/* Progress Bar */}
          {!isEditing && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-caption text-neutral-500 mb-2">
                <span>Pills remaining</span>
                <span>{Math.round((medication.remainingPills / medication.totalPills) * 100)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className={cn(
                    'h-3 rounded-full transition-all duration-300',
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isEditing ? (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {onEdit && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={onEdit}
                  className="flex-1"
                >
                  Edit Medication
                </Button>
              )}
              
              {medication.isActive ? (
                onDeactivate && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={onDeactivate}
                    className="flex-1"
                  >
                    Deactivate
                  </Button>
                )
              ) : (
                onActivate && (
                  <Button
                    variant="success"
                    size="md"
                    onClick={onActivate}
                    className="flex-1"
                  >
                    Reactivate
                  </Button>
                )
              )}
              
              {onDelete && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={onDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MedicationDetail;