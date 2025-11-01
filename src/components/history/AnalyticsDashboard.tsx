import { useState } from 'react';
import { Calendar, TrendingUp, FileText, Download } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useUser';
import { useIntakeRecordsByDateRange } from '@/hooks/useIntakeRecords';
import { useMedications } from '@/hooks/useMedications';
import {
  calculateAdherenceStats,
  getDailyAdherence,
  getMedicationAdherence,
} from '@/utils/analytics';
import { CalendarView } from './CalendarView';
import { DayDetailView } from './DayDetailView';
import { TrendAnalysis } from './TrendAnalysis';
import { AdherenceTrendChart } from './AdherenceTrendChart';
import { MedicationHistory } from './MedicationHistory';
import { ExportMenu } from './ExportButtons';
import { PDFExportButton } from './PDFExportButton';

type TabType = 'calendar' | 'trends' | 'history' | 'export';

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const user = useCurrentUser();
  const userId = user.data?.id;

  // Date range: last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const { data: records = [] } = useIntakeRecordsByDateRange(userId!, startDate, endDate);

  const { data: medications = [] } = useMedications(userId!);

  // Calculate analytics data
  const stats = calculateAdherenceStats(records);
  const dailyData = getDailyAdherence(records, 30);
  const medicationAdherence = getMedicationAdherence(records, medications);

  const tabs = [
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'trends' as const, label: 'Trends', icon: TrendingUp },
    { id: 'history' as const, label: 'History', icon: FileText },
    { id: 'export' as const, label: 'Export', icon: Download },
  ];

  if (!userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Please log in to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track your medication adherence and progress</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {activeTab === 'calendar' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <CalendarView onDateSelect={setSelectedDate} />
            {selectedDate && (
              <div className="bg-white rounded-lg shadow p-6">
                <DayDetailView selectedDate={selectedDate} onClose={() => setSelectedDate(null)} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Trend Analysis */}
            <TrendAnalysis />

            {/* Adherence Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Adherence Chart</h2>
              <AdherenceTrendChart />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto">
            <MedicationHistory />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Export Data</h2>
              <p className="text-sm text-gray-600 mb-6">
                Download your medication history and adherence data in various formats.
              </p>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium">Overall Adherence</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {stats.overall.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium">Doses Taken</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.takenDoses}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 font-medium">Doses Missed</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{stats.missedDoses}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-xs text-yellow-600 font-medium">Doses Skipped</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.skippedDoses}</p>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">CSV Exports</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Download data in spreadsheet format for analysis
                  </p>
                  <ExportMenu
                    data={{
                      records,
                      medications,
                      stats,
                      dailyData,
                      medicationAdherence,
                    }}
                  />
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    PDF Healthcare Report
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Generate a comprehensive PDF report for healthcare providers
                  </p>
                  <PDFExportButton
                    data={{
                      records,
                      medications,
                      stats,
                      dailyData,
                      medicationAdherence,
                    }}
                    {...(user.data?.name && { patientName: user.data.name })}
                    reportTitle="Medication Adherence Report"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
