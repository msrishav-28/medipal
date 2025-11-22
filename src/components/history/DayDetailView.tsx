import { useMemo } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { useIntakeRecordsByDateRange } from '@/hooks/useIntakeRecords';
import { useMedications } from '@/hooks/useMedications';
import { useCurrentUser } from '@/hooks/useUser';
import type { IntakeRecord, Medication } from '@/types';

interface DayDetailViewProps {
  selectedDate: Date;
  onClose?: () => void;
}

interface MedicationWithIntake {
  medication: Medication;
  intakeRecord?: IntakeRecord;
}

export function DayDetailView({ selectedDate, onClose }: DayDetailViewProps) {
  const { data: user } = useCurrentUser();
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const { data: intakeRecords = [] } = useIntakeRecordsByDateRange(
    user?.id || '',
    dayStart,
    dayEnd
  );
  
  const { data: medications = [] } = useMedications(user?.id || '');

  // Combine medications with their intake records for the selected day
  const medicationsWithIntake = useMemo(() => {
    const result: MedicationWithIntake[] = [];
    
    // Group intake records by medication ID
    const recordsByMedId = intakeRecords.reduce<Record<string, IntakeRecord[]>>((acc, record) => {
      if (!acc[record.medicationId]) {
        acc[record.medicationId] = [];
      }
      acc[record.medicationId]!.push(record);
      return acc;
    }, {});

    // Create entries for each medication with scheduled doses on this day
    medications.forEach((medication: Medication) => {
      const medRecords = recordsByMedId[medication.id] || [];
      
      if (medRecords.length > 0) {
        // Add an entry for each intake record
        medRecords.forEach((record) => {
          result.push({
            medication,
            intakeRecord: record,
          });
        });
      }
    });

    // Sort by scheduled time
    return result.sort((a, b) => {
      const timeA = a.intakeRecord?.scheduledTime.getTime() || 0;
      const timeB = b.intakeRecord?.scheduledTime.getTime() || 0;
      return timeA - timeB;
    });
  }, [medications, intakeRecords]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = medicationsWithIntake.length;
    const taken = medicationsWithIntake.filter(
      (m) => m.intakeRecord?.status === 'taken'
    ).length;
    const missed = medicationsWithIntake.filter(
      (m) => m.intakeRecord?.status === 'missed'
    ).length;
    const skipped = medicationsWithIntake.filter(
      (m) => m.intakeRecord?.status === 'skipped'
    ).length;
    const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

    return { total, taken, missed, skipped, adherenceRate };
  }, [medicationsWithIntake]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('default', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('default', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'missed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'bg-green-50 border-green-200';
      case 'missed':
        return 'bg-red-50 border-red-200';
      case 'skipped':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'taken':
        return 'Taken';
      case 'missed':
        return 'Missed';
      case 'skipped':
        return 'Skipped';
      default:
        return 'Scheduled';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              {formatDate(selectedDate)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {stats.total} medication{stats.total !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close day details"
          >
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        )}
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-xs md:text-sm font-medium text-green-600">Taken</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-green-700">{stats.taken}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs md:text-sm font-medium text-red-600">Missed</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-red-700">{stats.missed}</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs md:text-sm font-medium text-yellow-600">Skipped</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-yellow-700">{stats.skipped}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs md:text-sm font-medium text-blue-600">Adherence</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-blue-700">
            {stats.adherenceRate.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Medication List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Medication Details</h3>
        
        {medicationsWithIntake.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No medications scheduled for this day</p>
          </div>
        ) : (
          medicationsWithIntake.map((item, index) => (
            <div
              key={`${item.medication.id}-${item.intakeRecord?.id || index}`}
              className={`border rounded-lg p-4 ${getStatusColor(
                item.intakeRecord?.status || 'scheduled'
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(item.intakeRecord?.status || 'scheduled')}
                    <h4 className="font-semibold text-gray-900">
                      {item.medication.name}
                    </h4>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{item.medication.dosage}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Scheduled: {item.intakeRecord && formatTime(new Date(item.intakeRecord.scheduledTime))}
                      </span>
                    </div>
                    
                    {item.intakeRecord?.actualTime && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Actual: {formatTime(new Date(item.intakeRecord.actualTime))}
                        </span>
                      </div>
                    )}
                  </div>

                  {item.intakeRecord?.skipReason && (
                    <div className="mt-2 p-2 bg-white rounded text-xs md:text-sm">
                      <span className="font-medium text-gray-700">Reason: </span>
                      <span className="text-gray-600">{item.intakeRecord.skipReason}</span>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <span
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${
                        item.intakeRecord?.status === 'taken'
                          ? 'bg-green-100 text-green-700'
                          : item.intakeRecord?.status === 'missed'
                          ? 'bg-red-100 text-red-700'
                          : item.intakeRecord?.status === 'skipped'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {getStatusText(item.intakeRecord?.status || 'scheduled')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
