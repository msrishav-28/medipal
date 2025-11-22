import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CaregiverDashboard } from '../CaregiverDashboard';
import { caregiverService } from '@/services/caregiverService';
import { Caregiver, CaregiverActivity } from '@/types';

// Mock the services
vi.mock('@/services/caregiverService', () => ({
  caregiverService: {
    getCaregiversForPatient: vi.fn(),
    getPatientActivity: vi.fn(),
    updateAccessLevel: vi.fn(),
    deactivateCaregiver: vi.fn(),
    reactivateCaregiver: vi.fn(),
  },
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    data: { id: 'patient-123' },
    isLoading: false,
  })),
}));

describe('CaregiverDashboard', () => {
  const mockCaregivers: Caregiver[] = [
    {
      id: 'caregiver-1',
      patientId: 'patient-123',
      name: 'John Caregiver',
      email: 'john@example.com',
      phone: '5551234567',
      relationship: 'Spouse',
      accessLevel: 'view',
      isActive: true,
      notificationPreferences: {
        missedDose: true,
        criticalMedication: true,
        weeklyReport: true,
        smsEnabled: true,
        emailEnabled: true,
      },
      lastAccess: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'caregiver-2',
      patientId: 'patient-123',
      name: 'Jane Helper',
      email: 'jane@example.com',
      relationship: 'Child',
      accessLevel: 'manage',
      isActive: false,
      notificationPreferences: {
        missedDose: false,
        criticalMedication: true,
        weeklyReport: false,
        smsEnabled: false,
        emailEnabled: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockActivities: CaregiverActivity[] = [
    {
      id: 'activity-1',
      caregiverId: 'caregiver-1',
      patientId: 'patient-123',
      action: 'view_dashboard',
      details: 'Accessed patient dashboard',
      timestamp: new Date(),
    },
    {
      id: 'activity-2',
      caregiverId: 'caregiver-1',
      patientId: 'patient-123',
      action: 'mark_taken',
      details: 'Medication: Aspirin',
      timestamp: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(caregiverService.getCaregiversForPatient).mockResolvedValue(mockCaregivers);
    vi.mocked(caregiverService.getPatientActivity).mockResolvedValue(mockActivities);
  });

  it('should render dashboard with caregiver list', async () => {
    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('Caregiver Dashboard')).toBeInTheDocument();
      expect(screen.getByText('John Caregiver')).toBeInTheDocument();
      expect(screen.getByText('Jane Helper')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    vi.mocked(caregiverService.getCaregiversForPatient).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    vi.mocked(caregiverService.getPatientActivity).mockImplementation(
      () => new Promise(() => {})
    );

    render(<CaregiverDashboard patientId="patient-123" />);

    expect(screen.getByText('Loading caregivers...')).toBeInTheDocument();
  });

  it('should display active caregiver count', async () => {
    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Active Caregivers \(1\)/)).toBeInTheDocument();
    });
  });

  it('should show caregiver details', async () => {
    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('5551234567')).toBeInTheDocument();
      expect(screen.getByText('Spouse')).toBeInTheDocument();
    });
  });

  it('should display caregiver status badges', async () => {
    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getAllByText('Active')).toHaveLength(1);
      expect(screen.getAllByText('Inactive')).toHaveLength(1);
      expect(screen.getByText('View Only')).toBeInTheDocument();
      expect(screen.getByText('Can Manage')).toBeInTheDocument();
    });
  });

  it('should update access level', async () => {
    vi.mocked(caregiverService.updateAccessLevel).mockResolvedValue();

    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('John Caregiver')).toBeInTheDocument();
    });

    // Find and change access level dropdown
    const selects = screen.getAllByRole('combobox');
    const accessLevelSelect = selects.find(
      (select) => (select as HTMLSelectElement).value === 'view'
    ) as HTMLSelectElement;

    fireEvent.change(accessLevelSelect, { target: { value: 'manage' } });

    await waitFor(() => {
      expect(caregiverService.updateAccessLevel).toHaveBeenCalledWith('caregiver-1', 'manage');
    });
  });

  it('should deactivate caregiver with confirmation', async () => {
    // Mock window.confirm
    global.confirm = vi.fn(() => true);
    
    vi.mocked(caregiverService.deactivateCaregiver).mockResolvedValue();

    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('John Caregiver')).toBeInTheDocument();
    });

    // Click deactivate button
    const deactivateButton = screen.getByRole('button', { name: /deactivate/i });
    fireEvent.click(deactivateButton);

    expect(global.confirm).toHaveBeenCalledWith(
      'Are you sure you want to deactivate this caregiver?'
    );

    await waitFor(() => {
      expect(caregiverService.deactivateCaregiver).toHaveBeenCalledWith('caregiver-1');
    });
  });

  it('should not deactivate if confirmation is cancelled', async () => {
    global.confirm = vi.fn(() => false);
    
    vi.mocked(caregiverService.deactivateCaregiver).mockResolvedValue();

    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('John Caregiver')).toBeInTheDocument();
    });

    const deactivateButton = screen.getByRole('button', { name: /deactivate/i });
    fireEvent.click(deactivateButton);

    expect(caregiverService.deactivateCaregiver).not.toHaveBeenCalled();
  });

  it('should reactivate caregiver', async () => {
    vi.mocked(caregiverService.reactivateCaregiver).mockResolvedValue();

    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('Jane Helper')).toBeInTheDocument();
    });

    // Click reactivate button (Jane is inactive)
    const reactivateButton = screen.getByRole('button', { name: /reactivate/i });
    fireEvent.click(reactivateButton);

    await waitFor(() => {
      expect(caregiverService.reactivateCaregiver).toHaveBeenCalledWith('caregiver-2');
    });
  });

  it('should show add caregiver button', async () => {
    const mockOnGenerateCode = vi.fn();

    render(<CaregiverDashboard patientId="patient-123" onGenerateCode={mockOnGenerateCode} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add caregiver/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add caregiver/i });
    fireEvent.click(addButton);

    expect(mockOnGenerateCode).toHaveBeenCalled();
  });

  it('should show empty state when no caregivers', async () => {
    vi.mocked(caregiverService.getCaregiversForPatient).mockResolvedValue([]);

    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText("You haven't added any caregivers yet.")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add your first caregiver/i })).toBeInTheDocument();
    });
  });

  it('should display activity log', async () => {
    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText(/John Caregiver - view_dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/John Caregiver - mark_taken/)).toBeInTheDocument();
    });
  });

  it('should show activity details', async () => {
    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('Accessed patient dashboard')).toBeInTheDocument();
    });
  });

  it('should show empty activity log', async () => {
    vi.mocked(caregiverService.getPatientActivity).mockResolvedValue([]);

    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('No activity yet')).toBeInTheDocument();
    });
  });

  it('should display last access time', async () => {
    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Last access:/)).toBeInTheDocument();
    });
  });

  it('should handle errors when loading caregivers', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(caregiverService.getCaregiversForPatient).mockRejectedValue(
      new Error('Failed to load')
    );

    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('should reload data after updating access level', async () => {
    vi.mocked(caregiverService.updateAccessLevel).mockResolvedValue();

    render(<CaregiverDashboard patientId="patient-123" />);

    await waitFor(() => {
      expect(screen.getByText('John Caregiver')).toBeInTheDocument();
    });

    // Clear previous calls
    vi.mocked(caregiverService.getCaregiversForPatient).mockClear();

    // Update access level
    const selects = screen.getAllByRole('combobox');
    const accessLevelSelect = selects.find(
      (select) => (select as HTMLSelectElement).value === 'view'
    ) as HTMLSelectElement;

    fireEvent.change(accessLevelSelect, { target: { value: 'manage' } });

    await waitFor(() => {
      expect(caregiverService.getCaregiversForPatient).toHaveBeenCalledWith('patient-123');
    });
  });
});
