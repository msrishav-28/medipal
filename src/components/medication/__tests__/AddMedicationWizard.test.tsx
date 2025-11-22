import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddMedicationWizard from '../AddMedicationWizard';

describe('AddMedicationWizard', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const userId = 'test-user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial step correctly', () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Add New Medication')).toBeInTheDocument();
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByLabelText('Medication Name *')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Try to proceed without filling required fields
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Medication name is required')).toBeInTheDocument();
      expect(screen.getByText('Dosage is required')).toBeInTheDocument();
    });
  });

  it('progresses through steps when valid data is entered', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Fill basic info
    fireEvent.change(screen.getByLabelText('Medication Name *'), {
      target: { value: 'Metformin' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '500mg' },
    });

    // Proceed to next step
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('How would you like to schedule this medication?')).toBeInTheDocument();
    });
  });

  it('allows navigation back to previous steps', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Fill basic info and proceed
    fireEvent.change(screen.getByLabelText('Medication Name *'), {
      target: { value: 'Metformin' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '500mg' },
    });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    // Go back to previous step
    fireEvent.click(screen.getByText('Previous'));

    await waitFor(() => {
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Metformin')).toBeInTheDocument();
    });
  });

  it('validates schedule step correctly', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Complete basic info
    fireEvent.change(screen.getByLabelText('Medication Name *'), {
      target: { value: 'Metformin' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '500mg' },
    });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    // Select interval-based and enter invalid interval
    fireEvent.click(screen.getByLabelText('Regular Intervals'));
    
    const intervalInput = screen.getByLabelText('Interval (hours)');
    fireEvent.change(intervalInput, { target: { value: '0' } });

    // Try to proceed
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Interval must be between 1 and 24 hours')).toBeInTheDocument();
    });
  });

  it('completes full wizard flow and calls onSave', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Step 1: Basic Info
    fireEvent.change(screen.getByLabelText('Medication Name *'), {
      target: { value: 'Metformin' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '500mg' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Step 2: Schedule
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));

    // Step 3: Photo (skip)
    await waitFor(() => {
      expect(screen.getByText('Photo')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next'));

    // Step 4: Review and Save
    await waitFor(() => {
      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Save Medication')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Medication'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          name: 'Metformin',
          dosage: '500mg',
          form: 'tablet',
          isActive: true,
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows progress indicator correctly', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Check initial progress
    expect(screen.getByText('1')).toBeInTheDocument(); // Current step
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Complete first step
    fireEvent.change(screen.getByLabelText('Medication Name *'), {
      target: { value: 'Test Med' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '10mg' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Check progress updated
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument(); // Completed step
    });
  });

  it('handles time-based schedule configuration', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Complete basic info
    fireEvent.change(screen.getByLabelText('Medication Name *'), {
      target: { value: 'Test Med' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '10mg' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Configure schedule
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    // Should default to time-based
    expect(screen.getByLabelText('Specific Times')).toBeChecked();
    
    // Add additional time
    fireEvent.click(screen.getByText('Add Time'));
    
    const timeInputs = screen.getAllByDisplayValue('08:00');
    expect(timeInputs).toHaveLength(2);
  });

  it('handles interval-based schedule configuration', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Complete basic info
    fireEvent.change(screen.getByLabelText('Medication Name *'), {
      target: { value: 'Test Med' },
    });
    fireEvent.change(screen.getByLabelText('Dosage *'), {
      target: { value: '10mg' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Configure schedule
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    // Select interval-based
    fireEvent.click(screen.getByLabelText('Regular Intervals'));
    
    // Set interval
    const intervalInput = screen.getByLabelText('Interval (hours)');
    fireEvent.change(intervalInput, { target: { value: '12' } });

    expect(intervalInput).toHaveValue(12);
  });

  it('validates pill count correctly', async () => {
    render(
      <AddMedicationWizard
        userId={userId}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Set invalid pill counts
    fireEvent.change(screen.getByLabelText('Total Pills *'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText('Pills Remaining *'), {
      target: { value: '50' },
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Total pills must be at least 1')).toBeInTheDocument();
      expect(screen.getByText('Remaining pills must be between 0 and total pills')).toBeInTheDocument();
    });
  });
});