import { FileText } from 'lucide-react';
import type { IntakeRecord, Medication } from '@/types';
import type { AdherenceStats, DailyAdherence, MedicationAdherence } from '@/utils/analytics';
import { downloadPDFReport } from '@/utils/pdfExport';

interface PDFExportButtonProps {
  data: {
    stats: AdherenceStats;
    dailyData: DailyAdherence[];
    medicationAdherence: MedicationAdherence[];
    records: IntakeRecord[];
    medications: Medication[];
  };
  patientName?: string;
  reportTitle?: string;
  label?: string;
  className?: string;
}

export function PDFExportButton({
  data,
  patientName,
  reportTitle,
  label = 'Export PDF Report',
  className = '',
}: PDFExportButtonProps) {
  const handleExport = () => {
    try {
      downloadPDFReport({
        ...data,
        ...(patientName && { patientName }),
        ...(reportTitle && { reportTitle }),
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors ${className}`}
    >
      <FileText className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
