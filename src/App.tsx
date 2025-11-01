import { useState, useEffect } from 'react';
import { Button, QueryProvider, MedicationList, MedicationDetail, AddMedicationWizard, PrescriptionScanner, PrescriptionReview, VoiceInputDemo, ChatDemo, MedicationParsingDemo } from '@/components';
import { InstallPrompt, OfflineIndicator, UpdateNotification } from '@/components/pwa';
import { PerformanceDashboard } from '@/components/dev';
import { useBreakpoint, useMedications, useCreateMedication, useUpdateMedication } from '@/hooks';
import { databaseService, ParsedPrescription } from '@/services';
import { Medication } from '@/types';
import {
  reportPerformanceMetrics,
  logPerformanceMetrics,
  showCompatibilityWarning,
  applyPolyfills,
  logCompatibilityInfo,
} from '@/utils';

function AppContent() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'add' | 'scan' | 'review' | 'voice-demo' | 'chat-demo' | 'nlp-demo'>('list');
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [scannedData, setScannedData] = useState<{
    parsedData: ParsedPrescription;
    originalImage: string;
  } | null>(null);
  
  const { breakpoint, isMobile } = useBreakpoint();
  
  // Mock user ID for demo
  const userId = 'demo-user-1';
  
  const { data: medications = [], isLoading } = useMedications(userId);
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await databaseService.initialize();
        setDbInitialized(true);
        
        // Add some demo medications if none exist
        const existingMeds = await databaseService.medications.getByUserId(userId);
        if (existingMeds.length === 0) {
          await addDemoMedications();
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeDatabase();
  }, []);

  // Initialize performance monitoring and compatibility checks
  useEffect(() => {
    // Apply polyfills for older browsers
    applyPolyfills();
    
    // Check browser compatibility and show warnings if needed
    showCompatibilityWarning();
    
    // Set up performance monitoring
    reportPerformanceMetrics();
    
    // Log compatibility and performance info in development
    if (import.meta.env.DEV) {
      logCompatibilityInfo();
      
      // Log performance metrics after page load
      window.addEventListener('load', () => {
        setTimeout(logPerformanceMetrics, 2000);
      });
    }
  }, []);

  const addDemoMedications = async () => {
    const demoMedications = [
      {
        userId,
        name: 'Metformin',
        dosage: '500mg',
        form: 'tablet' as const,
        scheduleType: 'time-based' as const,
        times: ['08:00', '20:00'],
        instructions: 'Take with food',
        startDate: new Date(),
        refillReminder: 7,
        totalPills: 60,
        remainingPills: 45,
        isActive: true,
      },
      {
        userId,
        name: 'Lisinopril',
        dosage: '10mg',
        form: 'tablet' as const,
        scheduleType: 'time-based' as const,
        times: ['09:00'],
        instructions: 'Take in the morning',
        startDate: new Date(),
        refillReminder: 5,
        totalPills: 30,
        remainingPills: 8,
        isActive: true,
      },
      {
        userId,
        name: 'Vitamin D3',
        dosage: '1000 IU',
        form: 'capsule' as const,
        scheduleType: 'time-based' as const,
        times: ['08:00'],
        instructions: 'Take with breakfast',
        startDate: new Date(),
        refillReminder: 10,
        totalPills: 90,
        remainingPills: 75,
        isActive: true,
      },
    ];

    for (const med of demoMedications) {
      await createMedication.mutateAsync(med);
    }
  };

  const handleMedicationTaken = (medicationId: string) => {
    // In a real app, this would create an intake record
    console.log('Medication taken:', medicationId);
    // For demo, we'll just show a success message
    alert('Medication marked as taken!');
  };

  const handleMedicationEdit = (medicationId: string) => {
    setSelectedMedicationId(medicationId);
    setCurrentView('detail');
    setIsEditing(true);
  };

  const handleAddMedication = () => {
    setCurrentView('add');
  };

  const handleSaveNewMedication = async (medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createMedication.mutateAsync(medicationData);
      setCurrentView('list');
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Error saving medication. Please try again.');
    }
  };

  const handleCancelAddMedication = () => {
    setCurrentView('list');
  };

  const handleScanPrescription = () => {
    setCurrentView('scan');
  };

  const handleScanComplete = (parsedData: ParsedPrescription, originalImage: string) => {
    setScannedData({ parsedData, originalImage });
    setCurrentView('review');
  };

  const handleCancelScan = () => {
    setCurrentView('list');
    setScannedData(null);
  };

  const handleRescan = () => {
    setCurrentView('scan');
  };

  const handleSaveScannedMedication = async (medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createMedication.mutateAsync(medicationData);
      setCurrentView('list');
      setScannedData(null);
    } catch (error) {
      console.error('Error saving scanned medication:', error);
      alert('Error saving medication. Please try again.');
    }
  };

  const handleSaveMedication = async (updates: Partial<Medication>) => {
    if (selectedMedicationId) {
      await updateMedication.mutateAsync({
        id: selectedMedicationId,
        updates,
      });
      setIsEditing(false);
    }
  };

  const selectedMedication = medications.find(med => med.id === selectedMedicationId);

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h1 mb-4">Initializing MediCare...</h1>
          <p className="text-body text-neutral-600">Setting up your medication database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* PWA Components */}
      <InstallPrompt />
      <UpdateNotification />
      <OfflineIndicator />
      
      {/* Development Dashboard */}
      <PerformanceDashboard />
      
      <div className="max-w-6xl mx-auto p-4">
        <header className="text-center mb-8">
          <h1 className="text-display mb-4">MediCare System</h1>
          <p className="text-body-large text-neutral-600">
            Medication Management Demo
          </p>
          <p className="text-body text-neutral-500 mt-2">
            Current breakpoint: <span className="font-medium">{breakpoint}</span>
          </p>
        </header>

        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={currentView === 'list' ? 'primary' : 'secondary'}
            onClick={() => {
              setCurrentView('list');
              setSelectedMedicationId(null);
              setIsEditing(false);
            }}
          >
            Medication List
          </Button>
          {selectedMedication && (
            <Button
              variant={currentView === 'detail' ? 'primary' : 'secondary'}
              onClick={() => setCurrentView('detail')}
            >
              {selectedMedication.name} Details
            </Button>
          )}
          <Button
            variant={currentView === 'add' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('add')}
          >
            Add Medication
          </Button>
          <Button
            variant={currentView === 'scan' ? 'primary' : 'secondary'}
            onClick={handleScanPrescription}
          >
            Scan Prescription
          </Button>
          <Button
            variant={currentView === 'voice-demo' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('voice-demo')}
          >
            Voice Input Demo
          </Button>
          <Button
            variant={currentView === 'chat-demo' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('chat-demo')}
          >
            AI Chat Demo
          </Button>
          <Button
            variant={currentView === 'nlp-demo' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('nlp-demo')}
          >
            NLP Demo
          </Button>
        </div>

        {/* Main Content */}
        {currentView === 'list' ? (
          <MedicationList
            medications={medications}
            loading={isLoading}
            onMedicationTaken={handleMedicationTaken}
            onMedicationEdit={handleMedicationEdit}
            onAddMedication={handleAddMedication}
            cardSize={isMobile ? 'standard' : 'standard'}
          />
        ) : currentView === 'add' ? (
          <AddMedicationWizard
            userId={userId}
            onSave={handleSaveNewMedication}
            onCancel={handleCancelAddMedication}
          />
        ) : currentView === 'scan' ? (
          <PrescriptionScanner
            onScanComplete={handleScanComplete}
            onCancel={handleCancelScan}
          />
        ) : currentView === 'review' && scannedData ? (
          <PrescriptionReview
            parsedData={scannedData.parsedData}
            originalImage={scannedData.originalImage}
            userId={userId}
            onSave={handleSaveScannedMedication}
            onCancel={handleCancelScan}
            onRescan={handleRescan}
          />
        ) : currentView === 'voice-demo' ? (
          <VoiceInputDemo />
        ) : currentView === 'chat-demo' ? (
          <ChatDemo />
        ) : currentView === 'nlp-demo' ? (
          <MedicationParsingDemo />
        ) : selectedMedication ? (
          <MedicationDetail
            medication={selectedMedication}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSaveMedication}
            onCancel={() => setIsEditing(false)}
            onDelete={() => {
              console.log('Delete medication:', selectedMedication.id);
              alert('Delete functionality would be implemented here');
            }}
            onDeactivate={() => {
              console.log('Deactivate medication:', selectedMedication.id);
              alert('Deactivate functionality would be implemented here');
            }}
          />
        ) : null}

        <footer className="text-center mt-8">
          <p className="text-body text-neutral-500">
            Medication management components implemented!
          </p>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}

export default App;
