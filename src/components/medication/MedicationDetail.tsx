import React, { useState } from 'react';
import { Medication } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { Pill, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

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
      return { text: 'Inactive', color: 'text-muted-foreground', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20', icon: XCircle };
    }
    if (medication.remainingPills === 0) {
      return { text: 'Out of Stock', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle };
    }
    if (medication.remainingPills <= medication.refillReminder) {
      return { text: 'Refill Soon', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle };
    }
    return { text: 'Active', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2 };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={cn('medication-detail space-y-6', className)}>
      <GlassCard className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4">
          <div className="flex items-start gap-6 w-full">
            {/* Medication Image Placeholder */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-600/10 border border-white/10 flex items-center justify-center shadow-lg shadow-primary/10">
                <Pill className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-2">
              {isEditing ? (
                <div className="space-y-4 max-w-md">
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter medication name"
                    className="text-lg font-bold"
                  />
                  <div className="flex gap-4">
                    <Input
                      value={editForm.dosage}
                      onChange={(e) => handleInputChange('dosage', e.target.value)}
                      placeholder="Dosage"
                      className="flex-1"
                    />
                    <select
                      value={editForm.form}
                      onChange={(e) => handleInputChange('form', e.target.value)}
                      className="flex-1 px-3 py-2 border border-white/10 rounded-lg bg-black/20 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="liquid">Liquid</option>
                      <option value="injection">Injection</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {medication.name}
                    </h1>
                    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium", statusInfo.bg, statusInfo.color, statusInfo.border)}>
                      <StatusIcon className="w-4 h-4" />
                      {statusInfo.text}
                    </div>
                  </div>
                  <p className="text-xl text-muted-foreground">
                    {medication.dosage} • {medication.form}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Schedule
            </h3>
          </div>

          {isEditing ? (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Schedule Type
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="time-based"
                      checked={editForm.scheduleType === 'time-based'}
                      onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                      className="mr-3 w-4 h-4 accent-primary"
                    />
                    Specific Times
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="interval-based"
                      checked={editForm.scheduleType === 'interval-based'}
                      onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                      className="mr-3 w-4 h-4 accent-primary"
                    />
                    Interval
                  </label>
                </div>
              </div>

              {editForm.scheduleType === 'time-based' && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Daily Times
                  </label>
                  <div className="space-y-3">
                    {editForm.times.map((time, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          className="flex-1 bg-black/20"
                        />
                        {editForm.times.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTimeSlot}
                      className="w-full border-dashed border-white/20 hover:bg-white/5"
                    >
                      + Add Time Slot
                    </Button>
                  </div>
                </div>
              )}

              {editForm.scheduleType === 'interval-based' && (
                <div className="space-y-2">
                  <label className="text-sm">Hours between doses</label>
                  <Input
                    type="number"
                    value={editForm.interval}
                    onChange={(e) => handleInputChange('interval', parseInt(e.target.value))}
                    placeholder="e.g., 8"
                    min="1"
                    max="24"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-lg text-foreground pl-1">
              {formatSchedule()}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-3 pl-1">
            Instructions
          </h3>

          {isEditing ? (
            <textarea
              value={editForm.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Enter any special instructions..."
              className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 text-foreground resize-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50"
              rows={3}
            />
          ) : (
            <p className="text-muted-foreground pl-1 text-lg">
              {medication.instructions || 'No special instructions provided.'}
            </p>
          )}
        </div>

        {/* Pill Count & Inventory */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 pl-1">
            Inventory
          </h3>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase text-muted-foreground tracking-wider">Total Stock</label>
                <Input
                  type="number"
                  value={editForm.totalPills}
                  onChange={(e) => handleInputChange('totalPills', parseInt(e.target.value))}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-muted-foreground tracking-wider">Remaining</label>
                <Input
                  type="number"
                  value={editForm.remainingPills}
                  onChange={(e) => handleInputChange('remainingPills', parseInt(e.target.value))}
                  min="0"
                  max={editForm.totalPills}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-muted-foreground tracking-wider">Alert Threshold</label>
                <Input
                  type="number"
                  value={editForm.refillReminder}
                  onChange={(e) => handleInputChange('refillReminder', parseInt(e.target.value))}
                  min="1"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-sm text-muted-foreground mb-1">Total Stock</div>
                <div className="text-2xl font-bold font-mono">{medication.totalPills}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-sm text-muted-foreground mb-1">Remaining</div>
                <div className={cn("text-2xl font-bold font-mono",
                  medication.remainingPills <= medication.refillReminder ? "text-amber-500" : "text-foreground"
                )}>
                  {medication.remainingPills}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-sm text-muted-foreground mb-1">Refill Alert</div>
                <div className="text-2xl font-bold font-mono">{medication.refillReminder} <span className="text-sm font-sans font-normal text-muted-foreground">left</span></div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {!isEditing && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Supply Level</span>
                <span>{Math.round((medication.remainingPills / medication.totalPills) * 100)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500 ease-out',
                    {
                      'bg-green-500': medication.remainingPills > medication.refillReminder,
                      'bg-amber-500': medication.remainingPills <= medication.refillReminder && medication.remainingPills > 0,
                      'bg-red-500': medication.remainingPills === 0,
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
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                className="flex-1 shadow-lg shadow-primary/20"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
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
                  onClick={onEdit}
                  className="flex-1"
                >
                  Edit Medication
                </Button>
              )}

              {medication.isActive ? (
                onDeactivate && (
                  <Button
                    variant="outline"
                    onClick={onDeactivate}
                    className="flex-1"
                  >
                    Deactivate
                  </Button>
                )
              ) : (
                onActivate && (
                  <Button
                    onClick={onActivate}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Reactivate
                  </Button>
                )
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  onClick={onDelete}
                  className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default MedicationDetail;