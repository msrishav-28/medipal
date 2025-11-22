import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import IntakeConfirmation from '../IntakeConfirmation';
import { createTestMedication, createTestIntakeRecord } from '@/test/testUtils';

// Mock the hooks
const mockUseMarkDoseAsTaken = vi.fn();
const mockUseMarkDoseAsSkipped = vi.fn();
const mockUseStreakData = vi.fn();

vi.mock('@/hooks/useIntakeRecords', () => ({
  useMarkDoseAsTaken: mockUseMarkDoseAsTaken,
  useMarkDoseAsSkipped: mockUseMarkDoseAsSkipped,
  useStreakData: mockUseStreakData,
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('IntakeConfirmation', () => {
  const testMedication = createTestMedication({
    name: 'Metformin',
    dosage: '500mg',
    form: 'tablet',
    instructions: 'Take with food',
  });

  const testRecord = createTestIntakeRecord({
    medicationId: testMedication.id,
    scheduledTime: new Date('2024-01-01T08:00:00'),
  });

  const mockMutateAsync = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockOnSkip = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseMarkDoseAsTaken.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    
    mockUseMarkDoseAsSkipped.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });
    
    mockUseStreakData.mockReturnValue({
      data: {
        currentStreak: 5,
        longestStreak: 10,
        streakType: 'daily',
      },
    });
  });

  it('should render medication information correctly', () => {
    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onConfirm={mockOnConfirm}
        onSkip={mockOnSkip}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Time for Metformin')).toBeInTheDocument();
    expect(screen.getByText('500mg tablet')).toBeInTheDocument();
    expect(screen.getByText('Take with food')).toBeInTheDocument();
    expect(screen.getByText(/Scheduled for 8:00 AM/i)).toBeInTheDocument();
  });

  it('should display encouraging message based on streak', () => {
    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onConfirm={mockOnConfirm}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('5 day streak! Keep it up!')).toBeInTheDocument();
  });

  it('should display different messages for different streak lengths', () => {
    const testCases = [
      { streak: 0, expectedMessage: "Let's start a new streak today!" },
      { streak: 3, expectedMessage: '3 day streak! Keep it up!' },
      { streak: 10, expectedMessage: 'Amazing 10 day streak! 🎉' },
      { streak: 35, expectedMessage: 'Incredible 35 day streak! You\'re a champion! 🏆' },
    ];

    testCases.forEach(({ streak, expectedMessage }) => {
      mockUseStreakData.mockReturnValue({
        data: {
          currentStreak: streak,
          longestStreak: Math.max(streak, 10),
          streakType: 'daily',
        },
      });

      const { rerender } = render(
        <IntakeConfirmation
          medication={testMedication}
          scheduledRecord={testRecord}
          onConfirm={mockOnConfirm}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(expectedMessage)).toBeInTheDocument();

      rerender(<div />); // Clear for next test
    });
  });

  it('should handle "I Took It" button click', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(testRecord);

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onConfirm={mockOnConfirm}
      />,
      { wrapper: createWrapper() }
    );

    const takeButton = screen.getByText('I Took It! ✓');
    await user.click(takeButton);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: testRecord.id,
      actualTime: expect.any(Date),
    });

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(testRecord.id);
    });
  });

  it('should show loading state when confirming', async () => {
    mockUseMarkDoseAsTaken.mockReturnValue({
      mutateAsync: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      isPending: true,
    });

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onConfirm={mockOnConfirm}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Recording...')).toBeInTheDocument();
    expect(screen.getByText('Recording...')).toBeDisabled();
  });

  it('should show skip reasons when skip button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onSkip={mockOnSkip}
      />,
      { wrapper: createWrapper() }
    );

    const skipButton = screen.getByText('Skip This Dose');
    await user.click(skipButton);

    expect(screen.getByText('Why are you skipping this dose?')).toBeInTheDocument();
    expect(screen.getByText('Forgot to take it')).toBeInTheDocument();
    expect(screen.getByText('Side effects')).toBeInTheDocument();
    expect(screen.getByText('Feeling better')).toBeInTheDocument();
    expect(screen.getByText('Out of medication')).toBeInTheDocument();
    expect(screen.getByText('Doctor advised to skip')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should handle skip reason selection and submission', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(testRecord);

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onSkip={mockOnSkip}
      />,
      { wrapper: createWrapper() }
    );

    // Click skip button to show reasons
    const skipButton = screen.getByText('Skip This Dose');
    await user.click(skipButton);

    // Select a reason
    const sideEffectsButton = screen.getByText('Side effects');
    await user.click(sideEffectsButton);

    // Submit skip
    const submitSkipButton = screen.getByText('Skip Dose');
    await user.click(submitSkipButton);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: testRecord.id,
      reason: 'Side effects',
    });

    await waitFor(() => {
      expect(mockOnSkip).toHaveBeenCalledWith(testRecord.id, 'Side effects');
    });
  });

  it('should handle custom skip reason', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(testRecord);

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onSkip={mockOnSkip}
      />,
      { wrapper: createWrapper() }
    );

    // Click skip button to show reasons
    const skipButton = screen.getByText('Skip This Dose');
    await user.click(skipButton);

    // Select "Other"
    const otherButton = screen.getByText('Other');
    await user.click(otherButton);

    // Enter custom reason
    const textarea = screen.getByPlaceholderText('Please specify the reason...');
    await user.type(textarea, 'Custom reason for skipping');

    // Submit skip
    const submitSkipButton = screen.getByText('Skip Dose');
    await user.click(submitSkipButton);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: testRecord.id,
      reason: 'Custom reason for skipping',
    });
  });

  it('should disable skip submission without reason selection', async () => {
    const user = userEvent.setup();

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onSkip={mockOnSkip}
      />,
      { wrapper: createWrapper() }
    );

    // Click skip button to show reasons
    const skipButton = screen.getByText('Skip This Dose');
    await user.click(skipButton);

    // Skip button should be disabled without selection
    const submitSkipButton = screen.getByText('Skip Dose');
    expect(submitSkipButton).toBeDisabled();
  });

  it('should disable skip submission for "Other" without custom text', async () => {
    const user = userEvent.setup();

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onSkip={mockOnSkip}
      />,
      { wrapper: createWrapper() }
    );

    // Click skip button to show reasons
    const skipButton = screen.getByText('Skip This Dose');
    await user.click(skipButton);

    // Select "Other" but don't enter text
    const otherButton = screen.getByText('Other');
    await user.click(otherButton);

    // Skip button should be disabled without custom text
    const submitSkipButton = screen.getByText('Skip Dose');
    expect(submitSkipButton).toBeDisabled();
  });

  it('should go back from skip reasons', async () => {
    const user = userEvent.setup();

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onSkip={mockOnSkip}
      />,
      { wrapper: createWrapper() }
    );

    // Click skip button to show reasons
    const skipButton = screen.getByText('Skip This Dose');
    await user.click(skipButton);

    // Click back button
    const backButton = screen.getByText('Back');
    await user.click(backButton);

    // Should be back to main view
    expect(screen.getByText('Time for Metformin')).toBeInTheDocument();
    expect(screen.getByText('I Took It! ✓')).toBeInTheDocument();
  });

  it('should show close button when onClose is provided', () => {
    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Remind Me Later')).toBeInTheDocument();
  });

  it('should handle close button click', async () => {
    const user = userEvent.setup();

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onClose={mockOnClose}
      />,
      { wrapper: createWrapper() }
    );

    const closeButton = screen.getByText('Remind Me Later');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display current timestamp', () => {
    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Recorded at/i)).toBeInTheDocument();
  });

  it('should handle medication without pill image', () => {
    const medicationWithoutImage = { ...testMedication };
    delete (medicationWithoutImage as any).pillImage;

    render(
      <IntakeConfirmation
        medication={medicationWithoutImage}
        scheduledRecord={testRecord}
      />,
      { wrapper: createWrapper() }
    );

    // Should show first letter of medication name
    expect(screen.getByText('M')).toBeInTheDocument(); // First letter of "Metformin"
  });

  it('should handle medication with pill image', () => {
    const medicationWithImage = { 
      ...testMedication, 
      pillImage: 'https://example.com/pill.jpg' 
    };

    render(
      <IntakeConfirmation
        medication={medicationWithImage}
        scheduledRecord={testRecord}
      />,
      { wrapper: createWrapper() }
    );

    const image = screen.getByAltText('Metformin pill');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/pill.jpg');
  });

  it('should handle error during confirmation', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockMutateAsync.mockRejectedValue(new Error('Network error'));

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onConfirm={mockOnConfirm}
      />,
      { wrapper: createWrapper() }
    );

    const takeButton = screen.getByText('I Took It! ✓');
    await user.click(takeButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to mark dose as taken:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle error during skip', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockUseMarkDoseAsSkipped.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    render(
      <IntakeConfirmation
        medication={testMedication}
        scheduledRecord={testRecord}
        onSkip={mockOnSkip}
      />,
      { wrapper: createWrapper() }
    );

    // Navigate to skip reasons and submit
    const skipButton = screen.getByText('Skip This Dose');
    await user.click(skipButton);

    const sideEffectsButton = screen.getByText('Side effects');
    await user.click(sideEffectsButton);

    const submitSkipButton = screen.getByText('Skip Dose');
    await user.click(submitSkipButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to mark dose as skipped:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});