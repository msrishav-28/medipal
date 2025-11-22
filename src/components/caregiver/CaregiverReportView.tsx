import React, { useState, useEffect } from 'react';
import { PatientReport, caregiverReportingService } from '../../services';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface CaregiverReportViewProps {
  patientId: string;
  reportType?: 'weekly' | 'monthly';
}

export const CaregiverReportView: React.FC<CaregiverReportViewProps> = ({
  patientId,
  reportType = 'weekly'
}) => {
  const [report, setReport] = useState<PatientReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [patientId, reportType]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const generatedReport = reportType === 'weekly'
        ? await caregiverReportingService.generateWeeklyReport(patientId)
        : await caregiverReportingService.generateMonthlyReport(patientId);
      
      setReport(generatedReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    if (!report) return;
    const json = await caregiverReportingService.exportReportJSON(report);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adherence-report-${report.period.start.toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = async () => {
    if (!report) return;
    const text = await caregiverReportingService.exportReportText(report);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adherence-report-${report.period.start.toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Loading report...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-500">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  const adherenceRate = report.overallAdherence.adherenceRate;
  const isGoodAdherence = adherenceRate >= 80;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              📅 {reportType === 'weekly' ? 'Weekly' : 'Monthly'} Adherence Report
            </h2>
            <p className="text-gray-500 mt-1">
              {report.period.start.toLocaleDateString()} - {report.period.end.toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportJSON}>
              ⬇️ Export JSON
            </Button>
            <Button variant="secondary" onClick={handleExportText}>
              ⬇️ Export Text
            </Button>
          </div>
        </div>
      </Card>

      {/* Overall Adherence */}
      <Card className="p-6">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          {isGoodAdherence ? '📈' : '📉'} Overall Adherence
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">
                {adherenceRate.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">
                {report.overallAdherence.takenDoses} of {report.overallAdherence.totalDoses} doses
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${isGoodAdherence ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${adherenceRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Taken</p>
              <p className="text-3xl font-bold text-green-500">
                {report.overallAdherence.takenDoses}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Missed</p>
              <p className="text-3xl font-bold text-red-500">
                {report.overallAdherence.missedDoses}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Skipped</p>
              <p className="text-3xl font-bold text-orange-500">
                {report.overallAdherence.skippedDoses}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Medication Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-2">Medication Breakdown</h3>
        <p className="text-gray-500 mb-4">Individual adherence for each medication</p>
        <div className="space-y-6">
          {report.medicationBreakdown.map((med) => (
            <div key={med.medication.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{med.medication.name}</p>
                  <p className="text-sm text-gray-500">
                    {med.medication.dosage} - {med.medication.form}
                  </p>
                </div>
                <span className={`text-lg font-semibold ${
                  med.stats.adherenceRate >= 80 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {med.stats.adherenceRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    med.stats.adherenceRate >= 80 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${med.stats.adherenceRate}%` }}
                />
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>✓ {med.stats.takenDoses} taken</span>
                <span>✗ {med.stats.missedDoses} missed</span>
                <span>⊘ {med.stats.skippedDoses} skipped</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
