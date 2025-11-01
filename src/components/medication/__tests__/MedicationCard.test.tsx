import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MedicationCard from '../MedicationCard';
import { createTestMedication } from '@/test/testUtils';

describe('MedicationCard', () => {
  const mockOnTaken = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnSwipeLeft = vi.fn();
  const mockOnSwipeRight = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders medication information correctly', () => {
    const medication = createTestMedication({
      name: 'Lisinopril',
      dosage: '10mg',
      form: 'tablet',
      times: ['09:00'],
      remainingPills: 25,
      totalPills: 30,
    });

    render(
      <MedicationCard
        medication={medication}
        onTaken={mockOnTaken}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Lisinopril')).toBeInTheDocument();
    expect(screen.getByText('10mg tablet')).toBeInTheDocument();
    expect(screen.getByText('Next dose:')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('25 / 30')).toBeInTheDocument();
  });

  it('shows correct status badge for low pills', () => {
    const medication = createTestMedication({
      remainingPills: 5,
      refillReminder: 7,
    });

    render(<MedicationCard medication={medication} />);

    expect(screen.getByText('Refill Soon')).toBeInTheDocument();
  });

  it('shows inactive badge for inactive medications', () => {
    const medication = createTestMedication({
      isActive: false,
    });

    render(<MedicationCard medication={medication} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('calls onTaken when Mark as Taken button is clicked', () => {
    const medication = createTestMedication();

    render(
      <MedicationCard
        medication={medication}
        onTaken={mockOnTaken}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.click(screen.getByText('Mark as Taken'));
    expect(mockOnTaken).toHaveBeenCalledWith(medication.id);
  });

  it('calls onEdit when Edit button is clicked', () => {
    const medication = createTestMedication();

    render(
      <MedicationCard
        medication={medication}
        onTaken={mockOnTaken}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(medication.id);
  });

  it('renders compact size correctly', () => {
    const medication = createTestMedication();

    render(
      <MedicationCard
        medication={medication}
        size="compact"
        showActions={false}
      />
    );

    // Compact size should not show action buttons or detailed info
    expect(screen.queryByText('Mark as Taken')).not.toBeInTheDocument();
    expect(screen.queryByText('Pills remaining')).not.toBeInTheDocument();
  });

  it('handles interval-based schedule display', () => {
    const medication = createTestMedication({
      scheduleType: 'interval-based',
      interval: 8,
    });
    delete (medication as any).times;

    render(<MedicationCard medication={medication} />);

    expect(screen.getByText('Every 8 hours')).toBeInTheDocument();
  });

  it('displays pill image when available', () => {
    const medication = createTestMedication({
      pillImage: 'data:image/jpeg;base64,test-image-data',
    });

    render(<MedicationCard medication={medication} />);

    const image = screen.getByAltText('Metformin pill');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,test-image-data');
  });

  it('shows first letter when no pill image is available', () => {
    const medication = createTestMedication({
      name: 'Aspirin',
    });
    delete (medication as any).pillImage;

    render(<MedicationCard medication={medication} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('handles touch events for swipe gestures', () => {
    const medication = createTestMedication();

    render(
      <MedicationCard
        medication={medication}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = document.querySelector('.medication-card');
    
    // Simulate swipe left
    fireEvent.touchStart(card!, {
      targetTouches: [{ clientX: 100 }],
    });
    fireEvent.touchMove(card!, {
      targetTouches: [{ clientX: 40 }],
    });
    fireEvent.touchEnd(card!);

    expect(mockOnSwipeLeft).toHaveBeenCalledWith(medication.id);
  });

  it('calculates next dose time correctly', () => {
    // Mock current time to be 7:00 AM
    const mockDate = new Date('2024-01-01T07:00:00');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const medication = createTestMedication({
      times: ['08:00', '14:00', '20:00'],
    });

    render(<MedicationCard medication={medication} />);

    expect(screen.getByText('Next dose:')).toBeInTheDocument();
    expect(screen.getByText('8:00 AM')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows first dose of next day when all doses are past', () => {
    // Mock current time to be 11:00 PM
    const mockDate = new Date('2024-01-01T23:00:00');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const medication = createTestMedication({
      times: ['08:00', '14:00', '20:00'],
    });

    render(<MedicationCard medication={medication} />);

    expect(screen.getByText('Next dose:')).toBeInTheDocument();
    expect(screen.getByText('8:00 AM')).toBeInTheDocument();

    vi.useRealTimers();
  });
});