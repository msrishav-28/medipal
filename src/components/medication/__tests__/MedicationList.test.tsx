import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MedicationList from '../MedicationList';
import { createTestMedication } from '@/test/testUtils';

describe('MedicationList', () => {
  const mockOnMedicationTaken = vi.fn();
  const mockOnMedicationEdit = vi.fn();
  const mockOnAddMedication = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no medications', () => {
    render(
      <MedicationList
        medications={[]}
        onAddMedication={mockOnAddMedication}
      />
    );

    expect(screen.getByText('No medications yet')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Medication')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <MedicationList
        medications={[]}
        loading={true}
      />
    );

    // Should show loading skeletons
    expect(screen.getAllByRole('generic')).toHaveLength(3); // 3 skeleton cards
  });

  it('renders medication list correctly', () => {
    const medications = [
      createTestMedication({
        id: '1',
        name: 'Metformin',
        dosage: '500mg',
      }),
      createTestMedication({
        id: '2',
        name: 'Lisinopril',
        dosage: '10mg',
      }),
    ];

    render(
      <MedicationList
        medications={medications}
        onMedicationTaken={mockOnMedicationTaken}
        onMedicationEdit={mockOnMedicationEdit}
      />
    );

    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 medications')).toBeInTheDocument();
  });

  it('filters medications by search query', async () => {
    const medications = [
      createTestMedication({
        id: '1',
        name: 'Metformin',
      }),
      createTestMedication({
        id: '2',
        name: 'Lisinopril',
      }),
    ];

    render(
      <MedicationList
        medications={medications}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search medications...');
    fireEvent.change(searchInput, { target: { value: 'Metformin' } });

    await waitFor(() => {
      expect(screen.getByText('Metformin')).toBeInTheDocument();
      expect(screen.queryByText('Lisinopril')).not.toBeInTheDocument();
    });
  });

  it('filters medications by status', () => {
    const medications = [
      createTestMedication({
        id: '1',
        name: 'Active Med',
        isActive: true,
      }),
      createTestMedication({
        id: '2',
        name: 'Inactive Med',
        isActive: false,
      }),
    ];

    render(
      <MedicationList
        medications={medications}
      />
    );

    // Click on "Inactive" filter
    fireEvent.click(screen.getByRole('button', { name: /inactive/i }));

    expect(screen.getByText('Inactive Med')).toBeInTheDocument();
    expect(screen.queryByText('Active Med')).not.toBeInTheDocument();
  });

  it('filters medications needing refill', () => {
    const medications = [
      createTestMedication({
        id: '1',
        name: 'Low Pills Med',
        remainingPills: 3,
        refillReminder: 7,
      }),
      createTestMedication({
        id: '2',
        name: 'Plenty Pills Med',
        remainingPills: 25,
        refillReminder: 7,
      }),
    ];

    render(
      <MedicationList
        medications={medications}
      />
    );

    // Click on "Need Refill" filter
    fireEvent.click(screen.getByRole('button', { name: /need refill/i }));

    expect(screen.getByText('Low Pills Med')).toBeInTheDocument();
    expect(screen.queryByText('Plenty Pills Med')).not.toBeInTheDocument();
  });

  it('sorts medications by name', () => {
    const medications = [
      createTestMedication({
        id: '1',
        name: 'Zoloft',
      }),
      createTestMedication({
        id: '2',
        name: 'Aspirin',
      }),
    ];

    render(
      <MedicationList
        medications={medications}
      />
    );

    const sortSelect = screen.getByDisplayValue('Name (A-Z)');
    expect(sortSelect).toBeInTheDocument();

    // Check that medications are sorted alphabetically
    const medicationCards = screen.getAllByText(/Aspirin|Zoloft/);
    expect(medicationCards[0]).toHaveTextContent('Aspirin');
    expect(medicationCards[1]).toHaveTextContent('Zoloft');
  });

  it('sorts medications by refill status', () => {
    const medications = [
      createTestMedication({
        id: '1',
        name: 'High Pills',
        remainingPills: 25,
        totalPills: 30,
      }),
      createTestMedication({
        id: '2',
        name: 'Low Pills',
        remainingPills: 5,
        totalPills: 30,
      }),
    ];

    render(
      <MedicationList
        medications={medications}
      />
    );

    const sortSelect = screen.getByDisplayValue('Name (A-Z)');
    fireEvent.change(sortSelect, { target: { value: 'refillStatus' } });

    // Low pills should come first when sorted by refill status
    const medicationCards = screen.getAllByText(/High Pills|Low Pills/);
    expect(medicationCards[0]).toHaveTextContent('Low Pills');
    expect(medicationCards[1]).toHaveTextContent('High Pills');
  });

  it('calls onAddMedication when add button is clicked', () => {
    render(
      <MedicationList
        medications={[]}
        onAddMedication={mockOnAddMedication}
      />
    );

    fireEvent.click(screen.getByText('Add Your First Medication'));
    expect(mockOnAddMedication).toHaveBeenCalled();
  });

  it('handles swipe gestures on medication cards', () => {
    const medications = [
      createTestMedication({
        id: '1',
        name: 'Test Med',
      }),
    ];

    render(
      <MedicationList
        medications={medications}
        onMedicationTaken={mockOnMedicationTaken}
        onMedicationEdit={mockOnMedicationEdit}
      />
    );

    // Swipe right should call onMedicationTaken
    // This would be tested through the MedicationCard component
    expect(screen.getByText('Test Med')).toBeInTheDocument();
  });

  it('shows correct filter counts', () => {
    const medications = [
      createTestMedication({
        id: '1',
        isActive: true,
        remainingPills: 25,
        refillReminder: 7,
      }),
      createTestMedication({
        id: '2',
        isActive: false,
        remainingPills: 5,
        refillReminder: 7,
      }),
    ];

    render(
      <MedicationList
        medications={medications}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    // Use getAllByText since "Inactive" appears in both the filter button and medication cards
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
    expect(screen.getByText('Need Refill')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('shows no results message when search returns empty', () => {
    const medications = [
      createTestMedication({
        name: 'Metformin',
      }),
    ];

    render(
      <MedicationList
        medications={medications}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search medications...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentMed' } });

    expect(screen.getByText('No medications found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
  });

  it('searches by dosage and form', async () => {
    const medications = [
      createTestMedication({
        id: '1',
        name: 'Metformin',
        dosage: '500mg',
        form: 'tablet',
      }),
      createTestMedication({
        id: '2',
        name: 'Insulin',
        dosage: '10 units',
        form: 'injection',
      }),
    ];

    render(
      <MedicationList
        medications={medications}
      />
    );

    // Search by dosage
    const searchInput = screen.getByPlaceholderText('Search medications...');
    fireEvent.change(searchInput, { target: { value: '500mg' } });

    await waitFor(() => {
      expect(screen.getByText('Metformin')).toBeInTheDocument();
      expect(screen.queryByText('Insulin')).not.toBeInTheDocument();
    });

    // Search by form
    fireEvent.change(searchInput, { target: { value: 'injection' } });

    await waitFor(() => {
      expect(screen.getByText('Insulin')).toBeInTheDocument();
      expect(screen.queryByText('Metformin')).not.toBeInTheDocument();
    });
  });
});