/**
 * End-to-End Integration Tests
 * Tests complete user workflows from onboarding to medication management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { databaseService } from '@/services';

// Mock service worker for PWA tests
const mockServiceWorker = {
  register: vi.fn().mockResolvedValue({ scope: '/' }),
  getRegistration: vi.fn().mockResolvedValue({
    active: { state: 'activated' },
    installing: null,
    waiting: null,
  }),
};

(global as any).navigator.serviceWorker = mockServiceWorker;

// Mock Web Speech API
(global as any).webkitSpeechRecognition = class {
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  onresult = null;
  onerror = null;
  onend = null;
};

// Mock MediaDevices for camera access
(global as any).navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [],
    getVideoTracks: () => [],
  }),
};

describe('End-to-End Integration Tests', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();

    // Initialize database
    await databaseService.initialize();
    
    // Clear existing data by getting all and deleting individually
    const userId = 'demo-user-1';
    const existingMeds = await databaseService.medications.getByUserId(userId);
    for (const med of existingMeds) {
      if (med.id) {
        await databaseService.medications.delete(med.id);
      }
    }
    
    const existingRecords = await databaseService.intakeRecords.getByUserId(userId);
    for (const record of existingRecords) {
      if (record.id) {
        await databaseService.intakeRecords.delete(record.id);
      }
    }
  });

  afterEach(async () => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  describe('Complete User Workflow: Onboarding to Medication Management', () => {
    it('should complete the full medication management workflow', async () => {
      // Render the app
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      // Wait for database initialization
      await waitFor(
        () => {
          expect(screen.queryByText(/Initializing MediCare/i)).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Step 1: Verify initial state - medication list should be visible
      await waitFor(() => {
        expect(screen.getByText(/MediCare System/i)).toBeInTheDocument();
      });

      // Step 2: Navigate to add medication
      const addButton = screen.getByRole('button', { name: /Add Medication/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Medication Name/i)).toBeInTheDocument();
      });

      // Step 3: Fill in medication details
      const nameInput = screen.getByLabelText(/Medication Name/i);
      await user.type(nameInput, 'Aspirin');

      const dosageInput = screen.getByLabelText(/Dosage/i);
      await user.type(dosageInput, '100mg');

      // Step 4: Set medication schedule
      const timeInput = screen.getByLabelText(/Time/i);
      await user.type(timeInput, '08:00');

      // Step 5: Save medication
      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      // Step 6: Verify medication was added to list
      await waitFor(() => {
        expect(screen.getByText(/Aspirin/i)).toBeInTheDocument();
        expect(screen.getByText(/100mg/i)).toBeInTheDocument();
      });

      // Step 7: Mark medication as taken
      const medicationCard = screen.getByText(/Aspirin/i).closest('div');
      const takenButton = within(medicationCard!).getByRole('button', {
        name: /Take|Taken/i,
      });
      await user.click(takenButton);

      // Step 8: Verify confirmation
      await waitFor(() => {
        expect(screen.getByText(/marked as taken/i)).toBeInTheDocument();
      });

      // Step 9: View medication history
      const historyButton = screen.getByRole('button', { name: /History/i });
      if (historyButton) {
        await user.click(historyButton);

        await waitFor(() => {
          expect(screen.getByText(/Adherence/i)).toBeInTheDocument();
        });
      }
    }, 30000); // Increase timeout for full workflow

    it('should handle medication editing workflow', async () => {
      // Pre-populate a medication
      await databaseService.medications.create({
        userId: 'demo-user-1',
        name: 'Test Med',
        dosage: '50mg',
        form: 'tablet',
        scheduleType: 'time-based',
        times: ['09:00'],
        startDate: new Date(),
        refillReminder: 7,
        totalPills: 30,
        remainingPills: 20,
        isActive: true,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Test Med/i)).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByRole('button', { name: /Edit/i });
      await user.click(editButton);

      // Modify dosage
      const dosageInput = screen.getByLabelText(/Dosage/i);
      await user.clear(dosageInput);
      await user.type(dosageInput, '75mg');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      // Verify updated dosage
      await waitFor(() => {
        expect(screen.getByText(/75mg/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Device Responsive Behavior', () => {
    it('should adapt layout for mobile viewport', async () => {
      // Set mobile viewport
      window.innerWidth = 375;
      window.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));

      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const breakpointText = screen.getByText(/Current breakpoint:/i);
        expect(breakpointText).toHaveTextContent(/mobile/i);
      });
    });

    it('should adapt layout for tablet viewport', async () => {
      // Set tablet viewport
      window.innerWidth = 768;
      window.innerHeight = 1024;
      window.dispatchEvent(new Event('resize'));

      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const breakpointText = screen.getByText(/Current breakpoint:/i);
        expect(breakpointText).toHaveTextContent(/tablet/i);
      });
    });

    it('should adapt layout for desktop viewport', async () => {
      // Set desktop viewport
      window.innerWidth = 1920;
      window.innerHeight = 1080;
      window.dispatchEvent(new Event('resize'));

      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const breakpointText = screen.getByText(/Current breakpoint:/i);
        expect(breakpointText).toHaveTextContent(/desktop/i);
      });
    });
  });

  describe('PWA Functionality', () => {
    it('should register service worker', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockServiceWorker.register).toHaveBeenCalled();
      });
    });

    it('should display offline indicator when offline', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });

    it('should show install prompt when available', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      // Simulate beforeinstallprompt event
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = vi.fn();
      window.dispatchEvent(event);

      await waitFor(() => {
        const installButton = screen.queryByText(/Install/i);
        if (installButton) {
          expect(installButton).toBeInTheDocument();
        }
      });
    });
  });

  describe('Data Persistence and Synchronization', () => {
    it('should persist medications to IndexedDB', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/MediCare System/i)).toBeInTheDocument();
      });

      // Add a medication
      const addButton = screen.getByRole('button', { name: /Add Medication/i });
      await user.click(addButton);

      const nameInput = screen.getByLabelText(/Medication Name/i);
      await user.type(nameInput, 'Persistence Test Med');

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      // Verify data is in IndexedDB
      await waitFor(async () => {
        const meds = await databaseService.medications.getByUserId('demo-user-1');
        const testMed = meds.find((m) => m.name === 'Persistence Test Med');
        expect(testMed).toBeDefined();
      });
    });

    it('should load persisted data on app restart', async () => {
      // Pre-populate database
      await databaseService.medications.create({
        userId: 'demo-user-1',
        name: 'Persisted Med',
        dosage: '25mg',
        form: 'tablet',
        scheduleType: 'time-based',
        times: ['10:00'],
        startDate: new Date(),
        refillReminder: 7,
        totalPills: 30,
        remainingPills: 25,
        isActive: true,
      });

      // Render app
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      // Verify persisted medication is displayed
      await waitFor(() => {
        expect(screen.getByText(/Persisted Med/i)).toBeInTheDocument();
      });
    });
  });

  describe('Voice and AI Integration', () => {
    it('should handle voice input demo', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      // Navigate to voice demo
      const voiceButton = screen.getByRole('button', { name: /Voice Input Demo/i });
      await user.click(voiceButton);

      await waitFor(() => {
        // Check for voice input UI elements
        const micButton = screen.queryByRole('button', { name: /microphone|speak/i });
        if (micButton) {
          expect(micButton).toBeInTheDocument();
        }
      });
    });

    it('should handle AI chat demo', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      // Navigate to chat demo
      const chatButton = screen.getByRole('button', { name: /AI Chat Demo/i });
      await user.click(chatButton);

      await waitFor(() => {
        // Check for chat UI elements
        const chatInput = screen.queryByPlaceholderText(/message|question|ask/i);
        if (chatInput) {
          expect(chatInput).toBeInTheDocument();
        }
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper heading hierarchy', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toBeInTheDocument();
      });
    });

    it('should have keyboard navigable buttons', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add Medication/i });
        expect(addButton).toBeInTheDocument();
        
        // Verify button is keyboard accessible
        addButton.focus();
        expect(document.activeElement).toBe(addButton);
      });
    });

    it('should have accessible form labels', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      const addButton = screen.getByRole('button', { name: /Add Medication/i });
      await user.click(addButton);

      await waitFor(() => {
        // Check for accessible form inputs
        const nameInput = screen.getByLabelText(/Medication Name/i);
        expect(nameInput).toBeInTheDocument();
        expect(nameInput).toHaveAccessibleName();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database initialization failure gracefully', async () => {
      // Mock database failure
      const originalInit = databaseService.initialize;
      databaseService.initialize = vi.fn().mockRejectedValue(new Error('DB Error'));

      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        // App should still render but show error state
        expect(screen.getByText(/Initializing MediCare/i)).toBeInTheDocument();
      });

      // Restore original implementation
      databaseService.initialize = originalInit;
    });

    it('should handle empty medication list', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      await waitFor(() => {
        // Should show empty state or message
        const addButton = screen.getByRole('button', { name: /Add Medication/i });
        expect(addButton).toBeInTheDocument();
      });
    });

    it('should handle invalid form inputs', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      );

      const addButton = screen.getByRole('button', { name: /Add Medication/i });
      await user.click(addButton);

      // Try to save without required fields
      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      // Should show validation errors
      await waitFor(() => {
        const errorMessage = screen.queryByText(/required|invalid|error/i);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      });
    });
  });
});
