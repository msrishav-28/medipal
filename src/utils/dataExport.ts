import type { IntakeRecord, Medication } from '@/types';
import type { AdherenceStats, DailyAdherence, MedicationAdherence } from './analytics';

/**
 * Export intake records to CSV format
 */
export function exportIntakeRecordsToCSV(
  records: IntakeRecord[],
  medications: Medication[]
): string {
  const medicationMap = new Map(medications.map((m) => [m.id, m]));

  // CSV Header
  const headers = [
    'Date',
    'Time',
    'Medication',
    'Dosage',
    'Status',
    'Scheduled Time',
    'Actual Time',
    'Delay (minutes)',
    'Skip Reason',
  ];

  // CSV Rows
  const rows = records.map((record) => {
    const medication = medicationMap.get(record.medicationId);
    const scheduledTime = new Date(record.scheduledTime);
    const actualTime = record.actualTime ? new Date(record.actualTime) : null;

    const delay =
      actualTime && record.status === 'taken'
        ? Math.round((actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60))
        : null;

    return [
      scheduledTime.toLocaleDateString(),
      scheduledTime.toLocaleTimeString(),
      medication?.name || 'Unknown',
      medication?.dosage || '',
      record.status,
      scheduledTime.toLocaleString(),
      actualTime ? actualTime.toLocaleString() : '',
      delay !== null ? delay.toString() : '',
      record.skipReason || '',
    ];
  });

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export daily adherence data to CSV
 */
export function exportDailyAdherenceToCSV(dailyData: DailyAdherence[]): string {
  const headers = ['Date', 'Adherence Rate (%)', 'Taken', 'Missed', 'Skipped', 'Total'];

  const rows = dailyData.map((day) => [
    day.date,
    day.adherenceRate.toFixed(2),
    day.taken.toString(),
    day.missed.toString(),
    day.skipped.toString(),
    day.total.toString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export medication adherence summary to CSV
 */
export function exportMedicationAdherenceToCSV(medAdherence: MedicationAdherence[]): string {
  const headers = [
    'Medication',
    'Adherence Rate (%)',
    'Total Doses',
    'Taken',
    'Missed',
    'Skipped',
  ];

  const rows = medAdherence.map((med) => [
    med.medicationName,
    med.adherenceRate.toFixed(2),
    med.totalDoses.toString(),
    med.takenDoses.toString(),
    med.missedDoses.toString(),
    med.skippedDoses.toString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export complete adherence report to JSON
 */
export function exportAdherenceReportToJSON(data: {
  stats: AdherenceStats;
  dailyData: DailyAdherence[];
  medicationAdherence: MedicationAdherence[];
  records: IntakeRecord[];
  medications: Medication[];
  exportDate: Date;
}): string {
  const report = {
    exportDate: data.exportDate.toISOString(),
    period: {
      start: data.dailyData[0]?.date || '',
      end: data.dailyData[data.dailyData.length - 1]?.date || '',
      days: data.dailyData.length,
    },
    summary: {
      overallAdherence: data.stats.overall,
      dailyAdherence: data.stats.daily,
      weeklyAdherence: data.stats.weekly,
      monthlyAdherence: data.stats.monthly,
      totalDoses: data.stats.totalDoses,
      takenDoses: data.stats.takenDoses,
      missedDoses: data.stats.missedDoses,
      skippedDoses: data.stats.skippedDoses,
      onTimeRate: data.stats.onTimeRate,
    },
    dailyAdherence: data.dailyData,
    medicationAdherence: data.medicationAdherence,
    medications: data.medications.map((med) => ({
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      form: med.form,
      isActive: med.isActive,
    })),
    records: data.records.map((record) => ({
      id: record.id,
      medicationId: record.medicationId,
      scheduledTime: record.scheduledTime,
      actualTime: record.actualTime,
      status: record.status,
      skipReason: record.skipReason,
      snoozeCount: record.snoozeCount,
    })),
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with current date
 */
export function generateFilename(prefix: string, extension: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  return `${prefix}_${dateStr}.${extension}`;
}
