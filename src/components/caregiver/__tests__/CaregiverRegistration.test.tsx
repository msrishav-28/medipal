import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CaregiverRegistration } from '../CaregiverRegistration';
import { caregiverService } from '@/services/caregiverService';

// Mock the caregiver service
vi.mock('@/services/caregiverService', () => ({
  caregiverService: {
    registerCaregiver: vi.fn(),
  },
}));

describe('CaregiverRegistration', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render registration form', () => {
    render(<CaregiverRegistration />);

    expect(screen.getByText('Caregiver Registration')).toBeInTheDocument();
    expect(screen.getByLabelText(/access code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/relationship/i)).toBeInTheDocument();
  });

  it('should pre-populate code when provided', () => {
    render(<CaregiverRegistration code="ABC123" />);

    const codeInput = screen.getByLabelText(/access code/i) as HTMLInputElement;
    expect(codeInput.value).toBe('ABC123');
  });

  it('should validate required fields', async () => {
    render(<CaregiverRegistration />);

    const submitButton = screen.getByRole('button', { name: /register as caregiver/i });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const codeInput = screen.getByLabelText(/access code/i) as HTMLInputElement;
    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
    
    expect(codeInput.required).toBe(true);
    expect(nameInput.required).toBe(true);
  });

  it('should submit registration with valid data', async () => {
    vi.mocked(caregiverService.registerCaregiver).mockResolvedValue({
      id: 'caregiver-123',
      patientId: 'patient-123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      relationship: 'Spouse',
      accessLevel: 'view',
      isActive: true,
      notificationPreferences: {
        missedDose: true,
        criticalMedication: true,
        weeklyReport: true,
        smsEnabled: false,
        emailEnabled: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(<CaregiverRegistration onSuccess={mockOnSuccess} />);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/access code/i), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '5551234567' } });
    
    const relationshipSelect = screen.getByLabelText(/relationship/i);
    fireEvent.change(relationshipSelect, { target: { value: 'Spouse' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /register as caregiver/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(caregiverService.registerCaregiver).toHaveBeenCalledWith('ABC123', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '5551234567',
        relationship: 'Spouse',
      });
    });
  });

  it('should show loading state during registration', async () => {
    vi.mocked(caregiverService.registerCaregiver).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({} as any), 100))
    );

    render(<CaregiverRegistration />);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/access code/i), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    
    const relationshipSelect = screen.getByLabelText(/relationship/i);
    fireEvent.change(relationshipSelect, { target: { value: 'Spouse' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /register as caregiver/i });
    fireEvent.click(submitButton);

    expect(screen.getByText('Registering...')).toBeInTheDocument();
  });

  it('should display success message after registration', async () => {
    vi.mocked(caregiverService.registerCaregiver).mockResolvedValue({} as any);

    render(<CaregiverRegistration />);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/access code/i), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    
    const relationshipSelect = screen.getByLabelText(/relationship/i);
    fireEvent.change(relationshipSelect, { target: { value: 'Spouse' } });

    const submitButton = screen.getByRole('button', { name: /register as caregiver/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument();
    });
  });

  it('should call onSuccess after successful registration', async () => {
    vi.mocked(caregiverService.registerCaregiver).mockResolvedValue({} as any);
    vi.useFakeTimers();

    render(<CaregiverRegistration onSuccess={mockOnSuccess} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/access code/i), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    
    const relationshipSelect = screen.getByLabelText(/relationship/i);
    fireEvent.change(relationshipSelect, { target: { value: 'Spouse' } });

    // Submit form by finding the form element and triggering submit
    const form = screen.getByLabelText(/access code/i).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fast-forward time for the callback
    vi.advanceTimersByTime(2000);

    expect(mockOnSuccess).toHaveBeenCalled();

    vi.useRealTimers();
  }, 10000);

  it('should display error message when registration fails', async () => {
    vi.mocked(caregiverService.registerCaregiver).mockRejectedValue(
      new Error('Invalid access code')
    );

    render(<CaregiverRegistration />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/access code/i), { target: { value: 'INVALID' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    
    const relationshipSelect = screen.getByLabelText(/relationship/i);
    fireEvent.change(relationshipSelect, { target: { value: 'Spouse' } });

    // Submit form
    const form = screen.getByLabelText(/access code/i).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText(/invalid access code/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 10000);

  it('should handle form input changes', () => {
    render(<CaregiverRegistration />);

    const codeInput = screen.getByLabelText(/access code/i) as HTMLInputElement;
    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;

    fireEvent.change(codeInput, { target: { value: 'ABC123' } });
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    expect(codeInput.value).toBe('ABC123');
    expect(nameInput.value).toBe('Jane Doe');
  });

  it('should limit access code input to 6 characters', () => {
    render(<CaregiverRegistration />);

    const codeInput = screen.getByLabelText(/access code/i) as HTMLInputElement;
    
    expect(codeInput.maxLength).toBe(6);
  });

  it('should make phone number optional', () => {
    render(<CaregiverRegistration />);

    const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement;
    
    expect(phoneInput.required).toBe(false);
  });

  it('should submit without phone number', async () => {
    vi.mocked(caregiverService.registerCaregiver).mockResolvedValue({} as any);

    render(<CaregiverRegistration />);

    // Fill form without phone
    fireEvent.change(screen.getByLabelText(/access code/i), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
    
    const relationshipSelect = screen.getByLabelText(/relationship/i);
    fireEvent.change(relationshipSelect, { target: { value: 'Child' } });

    // Submit form
    const form = screen.getByLabelText(/access code/i).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(caregiverService.registerCaregiver).toHaveBeenCalledWith('ABC123', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        relationship: 'Child',
      });
    }, { timeout: 3000 });
  }, 10000);

  it('should display all relationship options', () => {
    render(<CaregiverRegistration />);

    const relationshipSelect = screen.getByLabelText(/relationship/i);
    const options = Array.from(relationshipSelect.querySelectorAll('option'));

    const optionValues = options.map(option => option.getAttribute('value'));
    
    expect(optionValues).toContain('Spouse');
    expect(optionValues).toContain('Partner');
    expect(optionValues).toContain('Parent');
    expect(optionValues).toContain('Child');
    expect(optionValues).toContain('Sibling');
    expect(optionValues).toContain('Friend');
    expect(optionValues).toContain('Healthcare Provider');
    expect(optionValues).toContain('Other');
  });
});
