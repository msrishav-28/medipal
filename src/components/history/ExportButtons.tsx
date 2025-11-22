import { Download } from 'lucide-react';
import type { IntakeRecord, Medication } from '@/types';
import type { AdherenceStats, DailyAdherence, MedicationAdherence } from '@/utils/analytics';
import {
  exportIntakeRecordsToCSV,
  exportDailyAdherenceToCSV,
  exportMedicationAdherenceToCSV,
  exportAdherenceReportToJSON,
  downloadFile,
  generateFilename,
} from '@/utils/dataExport';

interface ExportButtonProps {
  type: 'records' | 'daily' | 'medication' | 'full-report';
  data: {
    records?: IntakeRecord[];
    medications?: Medication[];
    stats?: AdherenceStats;
    dailyData?: DailyAdherence[];
    medicationAdherence?: MedicationAdherence[];
  };
  label?: string;
  className?: string;
}

export function ExportButton({ type, data, label, className = '' }: ExportButtonProps) {
  const handleExport = () => {
    try {
      switch (type) {
        case 'records':
          if (data.records && data.medications) {
            const csv = exportIntakeRecordsToCSV(data.records, data.medications);
            downloadFile(csv, generateFilename('intake-records', 'csv'), 'text/csv');
          }
          break;

        case 'daily':
          if (data.dailyData) {
            const csv = exportDailyAdherenceToCSV(data.dailyData);
            downloadFile(csv, generateFilename('daily-adherence', 'csv'), 'text/csv');
          }
          break;

        case 'medication':
          if (data.medicationAdherence) {
            const csv = exportMedicationAdherenceToCSV(data.medicationAdherence);
            downloadFile(csv, generateFilename('medication-adherence', 'csv'), 'text/csv');
          }
          break;

        case 'full-report':
          if (
            data.stats &&
            data.dailyData &&
            data.medicationAdherence &&
            data.records &&
            data.medications
          ) {
            const json = exportAdherenceReportToJSON({
              stats: data.stats,
              dailyData: data.dailyData,
              medicationAdherence: data.medicationAdherence,
              records: data.records,
              medications: data.medications,
              exportDate: new Date(),
            });
            downloadFile(
              json,
              generateFilename('adherence-report', 'json'),
              'application/json'
            );
          }
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const getDefaultLabel = () => {
    switch (type) {
      case 'records':
        return 'Export Records (CSV)';
      case 'daily':
        return 'Export Daily Data (CSV)';
      case 'medication':
        return 'Export by Medication (CSV)';
      case 'full-report':
        return 'Export Full Report (JSON)';
      default:
        return 'Export';
    }
  };

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
    >
      <Download className="h-4 w-4" />
      <span>{label || getDefaultLabel()}</span>
    </button>
  );
}

interface ExportMenuProps {
  data: {
    records: IntakeRecord[];
    medications: Medication[];
    stats: AdherenceStats;
    dailyData: DailyAdherence[];
    medicationAdherence: MedicationAdherence[];
  };
}

export function ExportMenu({ data }: ExportMenuProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <ExportButton type="records" data={data} />
      <ExportButton type="daily" data={data} />
      <ExportButton type="medication" data={data} />
      <ExportButton type="full-report" data={data} />
    </div>
  );
}
