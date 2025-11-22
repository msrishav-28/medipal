import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { IntakeRecord, Medication } from '@/types';
import type { AdherenceStats, DailyAdherence, MedicationAdherence } from './analytics';

/**
 * Generate a PDF report for healthcare providers
 */
export function generatePDFReport(data: {
  stats: AdherenceStats;
  dailyData: DailyAdherence[];
  medicationAdherence: MedicationAdherence[];
  records: IntakeRecord[];
  medications: Medication[];
  patientName?: string;
  reportTitle?: string;
}): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.reportTitle || 'Medication Adherence Report', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 10;

  // Patient info and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 5;

  if (data.patientName) {
    doc.text(`Patient: ${data.patientName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
  }

  // Period
  const startDate = data.dailyData[0]?.date || '';
  const endDate = data.dailyData[data.dailyData.length - 1]?.date || '';
  doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Summary Statistics Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Overall Adherence Rate', `${data.stats.overall.toFixed(1)}%`],
    ['Daily Average Adherence', `${data.stats.daily.toFixed(1)}%`],
    ['Weekly Average Adherence', `${data.stats.weekly.toFixed(1)}%`],
    ['Monthly Average Adherence', `${data.stats.monthly.toFixed(1)}%`],
    ['On-Time Rate', `${data.stats.onTimeRate.toFixed(1)}%`],
    ['Total Doses Scheduled', data.stats.totalDoses.toString()],
    ['Doses Taken', data.stats.takenDoses.toString()],
    ['Doses Missed', data.stats.missedDoses.toString()],
    ['Doses Skipped', data.stats.skippedDoses.toString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Medication Adherence Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Adherence by Medication', 14, yPosition);
  yPosition += 8;

  const medicationData = data.medicationAdherence.map((med) => [
    med.medicationName,
    `${med.adherenceRate.toFixed(1)}%`,
    med.totalDoses.toString(),
    med.takenDoses.toString(),
    med.missedDoses.toString(),
    med.skippedDoses.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Medication', 'Adherence', 'Total', 'Taken', 'Missed', 'Skipped']],
    body: medicationData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Daily Adherence Trend Section
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Adherence Trend', 14, yPosition);
  yPosition += 8;

  const dailyTableData = data.dailyData.map((day) => [
    day.date,
    `${day.adherenceRate.toFixed(1)}%`,
    day.taken.toString(),
    day.missed.toString(),
    day.skipped.toString(),
    day.total.toString(),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Date', 'Adherence', 'Taken', 'Missed', 'Skipped', 'Total']],
    body: dailyTableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Recent Medication Records Section
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Medication Records', 14, yPosition);
  yPosition += 8;

  const medicationMap = new Map(data.medications.map((m) => [m.id, m]));

  // Show last 20 records
  const recentRecords = data.records.slice(-20).reverse();
  const recordsData = recentRecords.map((record) => {
    const medication = medicationMap.get(record.medicationId);
    const scheduledTime = new Date(record.scheduledTime);
    const actualTime = record.actualTime ? new Date(record.actualTime) : null;

    return [
      scheduledTime.toLocaleDateString(),
      scheduledTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      medication?.name || 'Unknown',
      medication?.dosage || '',
      record.status,
      actualTime
        ? actualTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Date', 'Scheduled', 'Medication', 'Dosage', 'Status', 'Actual Time']],
    body: recordsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      'MediPal - Medication Adherence Tracking',
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  return doc;
}

/**
 * Download PDF report
 */
export function downloadPDFReport(
  data: {
    stats: AdherenceStats;
    dailyData: DailyAdherence[];
    medicationAdherence: MedicationAdherence[];
    records: IntakeRecord[];
    medications: Medication[];
    patientName?: string;
    reportTitle?: string;
  },
  filename?: string
): void {
  const doc = generatePDFReport(data);
  const date = new Date().toISOString().split('T')[0];
  const defaultFilename = `adherence-report_${date}.pdf`;
  doc.save(filename || defaultFilename);
}
