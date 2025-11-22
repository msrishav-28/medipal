import { useState, useEffect } from 'react';
import { QueryProvider } from '@/components';
import { InstallPrompt, OfflineIndicator, UpdateNotification } from '@/components/pwa';
import {
  MedicationDashboard,
  MedicationList,
  AddMedicationWizard,
  PrescriptionScanner,
  PrescriptionReview,
} from '@/components/medication';
import { NotificationSettings } from '@/components/notification';
import { CaregiverDashboard, AccessCodeGenerator } from '@/components/caregiver';
import { AnalyticsDashboard } from '@/components/history';
import { ChatInterface } from '@/components/ui';
import {
  useBreakpoint,
  useMedications,
  useCreateMedication,
  useIntakeRecords,
} from '@/hooks';
import { databaseService, ParsedPrescription } from '@/services';
import { Medication } from '@/types';
import {
  Home,
  Pill,
  Bell,
  Users,
  BarChart3,
  MessageCircle,
  Settings,
  Menu,
  X,
} from 'lucide-react';

type View =
  | 'dashboard'
  | 'medications'
  | 'add-medication'
  | 'scan-prescription'
  | 'notifications'
  | 'caregivers'
  | 'analytics'
  | 'chat'
  | 'settings';

function MainAppContent() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  const [showAccessCodeGen, setShowAccessCodeGen] = useState(false);
  const [scannedData, setScannedData] = useState<{
    parsedData: ParsedPrescription;
    originalImage: string;
  } | null>(null);

  const { isMobile } = useBreakpoint();

  // User ID (in production, this would come from auth)
  const userId = 'user-123';

  const { data: medications = [], isLoading: medicationsLoading } = useMedications(userId);
  const { data: intakeRecords = [] } = useIntakeRecords(userId);
  const createMedication = useCreateMedication();
  // Future: notifications integration
  // const { activeReminders } = useNotifications(userId);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await databaseService.initialize();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeDatabase();
  }, []);

  const handleMedicationSaved = async (medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createMedication.mutateAsync(medicationData);
      setCurrentView('medications');
      setScannedData(null);
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Error saving medication. Please try again.');
    }
  };

  const handleScanComplete = (parsedData: ParsedPrescription, originalImage: string) => {
    setScannedData({ parsedData, originalImage });
  };

  const handleCancelScan = () => {
    setCurrentView('medications');
    setScannedData(null);
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
    { id: 'medications' as const, label: 'Medications', icon: Pill },
    { id: 'notifications' as const, label: 'Reminders', icon: Bell },
    { id: 'caregivers' as const, label: 'Caregivers', icon: Users },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'chat' as const, label: 'AI Assistant', icon: MessageCircle },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Initializing MediPal...</h1>
          <p className="text-gray-600">Setting up your medication database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA Components */}
      <InstallPrompt />
      <UpdateNotification />
      <OfflineIndicator />

      {/* Active Reminders - Future integration */}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">MediPal</h1>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="hidden md:flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobile && showMenu && (
          <nav className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setShowMenu(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <MedicationDashboard userId={userId} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setCurrentView('medications')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <Pill className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="text-lg font-semibold">Medications</h3>
                <p className="text-gray-600 text-sm">Manage your medications</p>
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
              >
                <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="text-lg font-semibold">Analytics</h3>
                <p className="text-gray-600 text-sm">View your adherence stats</p>
              </button>
            </div>
          </div>
        )}

        {currentView === 'medications' && !scannedData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-900">My Medications</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('add-medication')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Medication
                </button>
                <button
                  onClick={() => setCurrentView('scan-prescription')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Scan Prescription
                </button>
              </div>
            </div>
            <MedicationList
              medications={medications}
              loading={medicationsLoading}
              onMedicationTaken={(id) => console.log('Taken:', id)}
              onMedicationEdit={(id) => console.log('Edit:', id)}
              onAddMedication={() => setCurrentView('add-medication')}
            />
          </div>
        )}

        {currentView === 'add-medication' && (
          <AddMedicationWizard
            userId={userId}
            onSave={handleMedicationSaved}
            onCancel={() => setCurrentView('medications')}
          />
        )}

        {currentView === 'scan-prescription' && !scannedData && (
          <PrescriptionScanner
            onScanComplete={handleScanComplete}
            onCancel={handleCancelScan}
          />
        )}

        {scannedData && (
          <PrescriptionReview
            parsedData={scannedData.parsedData}
            originalImage={scannedData.originalImage}
            userId={userId}
            onSave={handleMedicationSaved}
            onCancel={handleCancelScan}
            onRescan={() => setScannedData(null)}
          />
        )}

        {currentView === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Notification Settings</h2>
            <NotificationSettings />
          </div>
        )}

        {currentView === 'caregivers' && (
          <div className="space-y-6">
            <CaregiverDashboard
              patientId={userId}
              onGenerateCode={() => setShowAccessCodeGen(true)}
            />
            {showAccessCodeGen && (
              <AccessCodeGenerator
                patientId={userId}
                onClose={() => setShowAccessCodeGen(false)}
                onCodeGenerated={() => {}}
              />
            )}
          </div>
        )}

        {currentView === 'analytics' && <AnalyticsDashboard />}

        {currentView === 'chat' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">AI Assistant</h2>
            <ChatInterface
              userId={userId}
              medications={medications}
              intakeRecords={intakeRecords}
              height="600px"
            />
          </div>
        )}

        {currentView === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Settings panel - Coming soon</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function MainApp() {
  return (
    <QueryProvider>
      <MainAppContent />
    </QueryProvider>
  );
}
