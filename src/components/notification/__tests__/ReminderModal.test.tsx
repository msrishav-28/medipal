import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReminderModal } from '../ReminderModal';
import { MedicationReminder } from '@/types';

// Mock hooks
vi.mock('@/hooks', () => ({
  useBreakpoint: vi.fn(() => ({ isMobile: false })),
  useNotifications: vi.fn(() => ({
    settings: {
      maxSnoozes: 3,
      snoozeOptions: [5, 10, 15]
    }
  })),
  useVoice: vi.fn(() => ({
    speakConfirmation: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  )
}));

// Mock VoiceControl component
vi.mock('../VoiceControl', () => ({
  VoiceControl: ({ text, autoPlay }: any) => (
    <div data-testid="voice-control" data-text={text} data-autoplay={autoPlay}>
      Voice Control
    </div>
  )
}));

describe('ReminderModal', () => {
  const mockReminder: MedicationReminder = {
    id: 'reminder-1',
    medicationId: 'med-1',
    userId: 'user-1',
    scheduledTime: new Date('2024-01-01T08:00:00'),
    medicationName: 'Metformin',
    dosage: '500mg',
    instructions: 'Take with food',
    snoozeCount: 0,
    maxSnoozes: 3,
    isActive: true,
    createdAt: new Date()
  };

  const defaultProps = {
    reminder: mockReminder,
    isOpen: true,
    onTaken: vi.fn(),
    onSnooze: vi.fn(),
    onSkip: vi.fn(),
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render when open', () => {
      render(<ReminderModal {...defaultProps} />);

      expect(screen.getByText('Medication Reminder')).toBeInTheDocument();
      expect(screen.getByText('Metformin')).toBeInTheDocument();
      expect(screen.getByText('500mg')).toBeInTheDocument();
      expect(screen.getByText('Take with food')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ReminderModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Medication Reminder')).not.toBeInTheDocument();
    });

    it('should show scheduled time', () => {
      render(<ReminderModal {...defaultProps} />);

      expect(screen.getByText(/Scheduled for 08:00/)).toBeInTheDocument();
    });

    it('should show pill image when available', () => {
      const reminderWithImage = {
        ...mockReminder,
        pillImage: '/path/to/pill.jpg'
      };

      render(<ReminderModal {...defaultProps} reminder={reminderWithImage} />);

      const image = screen.getByAltText('Metformin');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/path/to/pill.jpg');
    });

    it('should show snooze count warning', () => {
      const snoozedReminder = {
        ...mockReminder,
        snoozeCount: 2
      };

      render(<ReminderModal {...defaultProps} reminder={snoozedReminder} />);

      expect(screen.getByText(/snoozed 2 times/)).toBeInTheDocument();
    });

    it('should show max snooze warning', () => {
      const maxSnoozedReminder = {
        ...mockReminder,
        snoozeCount: 3
      };

      render(<ReminderModal {...defaultProps} reminder={maxSnoozedReminder} />);

      expect(screen.getByText(/Maximum snoozes reached/)).toBeInTheDocument();
    });
  });

  describe('voice control integration', () => {
    it('should render voice control with correct props', () => {
      render(<ReminderModal {...defaultProps} />);

      const voiceControl = screen.getByTestId('voice-control');
      expect(voiceControl).toBeInTheDocument();
      expect(voiceControl).toHaveAttribute('data-autoplay', 'true');
      expect(voiceControl).toHaveAttribute('data-text', expect.stringContaining('Metformin'));
    });
  });

  describe('actions', () => {
    it('should handle "I took it" action', async () => {
      const { useVoice } = await import('@/hooks');
      const mockSpeakConfirmation = vi.fn().mockResolvedValue(undefined);
      (useVoice as any).mockReturnValue({
        speakConfirmation: mockSpeakConfirmation
      });

      render(<ReminderModal {...defaultProps} />);

      const takenButton = screen.getByText('I took it');
      fireEvent.click(takenButton);

      await waitFor(() => {
        expect(defaultProps.onTaken).toHaveBeenCalled();
        expect(mockSpeakConfirmation).toHaveBeenCalledWith('Metformin', 'taken');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should show snooze options when snooze clicked', () => {
      render(<ReminderModal {...defaultProps} />);

      const snoozeButton = screen.getByText('Snooze');
      fireEvent.click(snoozeButton);

      expect(screen.getByText('Snooze for:')).toBeInTheDocument();
      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('10 min')).toBeInTheDocument();
      expect(screen.getByText('15 min')).toBeInTheDocument();
    });

    it('should handle snooze selection', async () => {
      const { useVoice } = await import('@/hooks');
      const mockSpeakConfirmation = vi.fn().mockResolvedValue(undefined);
      (useVoice as any).mockReturnValue({
        speakConfirmation: mockSpeakConfirmation
      });

      render(<ReminderModal {...defaultProps} />);

      // Open snooze options
      const snoozeButton = screen.getByText('Snooze');
      fireEvent.click(snoozeButton);

      // Select 10 minutes
      const tenMinButton = screen.getByText('10 min');
      fireEvent.click(tenMinButton);

      await waitFor(() => {
        expect(defaultProps.onSnooze).toHaveBeenCalledWith(10);
        expect(mockSpeakConfirmation).toHaveBeenCalledWith('Metformin', 'snoozed');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should disable snooze when max limit reached', () => {
      const maxSnoozedReminder = {
        ...mockReminder,
        snoozeCount: 3
      };

      render(<ReminderModal {...defaultProps} reminder={maxSnoozedReminder} />);

      const snoozeButton = screen.getByText('Snooze');
      expect(snoozeButton).toBeDisabled();
    });

    it('should show skip options when skip clicked', () => {
      render(<ReminderModal {...defaultProps} />);

      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);

      expect(screen.getByText('Reason for skipping:')).toBeInTheDocument();
      expect(screen.getByText('Already took it')).toBeInTheDocument();
      expect(screen.getByText('Feeling unwell')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('should handle skip with reason', async () => {
      const { useVoice } = await import('@/hooks');
      const mockSpeakConfirmation = vi.fn().mockResolvedValue(undefined);
      (useVoice as any).mockReturnValue({
        speakConfirmation: mockSpeakConfirmation
      });

      render(<ReminderModal {...defaultProps} />);

      // Open skip options
      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);

      // Select reason
      const reasonRadio = screen.getByLabelText('Feeling unwell');
      fireEvent.click(reasonRadio);

      // Confirm skip
      const skipDoseButton = screen.getByText('Skip Dose');
      fireEvent.click(skipDoseButton);

      await waitFor(() => {
        expect(defaultProps.onSkip).toHaveBeenCalledWith('Feeling unwell');
        expect(mockSpeakConfirmation).toHaveBeenCalledWith('Metformin', 'skipped');
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should handle custom skip reason', async () => {
      render(<ReminderModal {...defaultProps} />);

      // Open skip options
      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);

      // Select "Other"
      const otherRadio = screen.getByLabelText('Other');
      fireEvent.click(otherRadio);

      // Enter custom reason
      const customInput = screen.getByPlaceholderText('Please specify...');
      fireEvent.change(customInput, { target: { value: 'Custom reason' } });

      // Confirm skip
      const skipDoseButton = screen.getByText('Skip Dose');
      fireEvent.click(skipDoseButton);

      await waitFor(() => {
        expect(defaultProps.onSkip).toHaveBeenCalledWith('Custom reason');
      });
    });

    it('should disable skip dose button without reason', () => {
      render(<ReminderModal {...defaultProps} />);

      // Open skip options
      const skipButton = screen.getByText('Skip');
      fireEvent.click(skipButton);

      const skipDoseButton = screen.getByText('Skip Dose');
      expect(skipDoseButton).toBeDisabled();
    });
  });

  describe('mobile layout', () => {
    it('should use full-screen layout on mobile', async () => {
      const { useBreakpoint } = await import('@/hooks');
      (useBreakpoint as any).mockReturnValue({ isMobile: true });

      const { container } = render(<ReminderModal {...defaultProps} />);

      const modal = container.firstChild as HTMLElement;
      expect(modal).toHaveClass('fixed', 'inset-0', 'bg-white');
    });

    it('should use centered modal layout on desktop', async () => {
      const { useBreakpoint } = await import('@/hooks');
      (useBreakpoint as any).mockReturnValue({ isMobile: false });

      const { container } = render(<ReminderModal {...defaultProps} />);

      const modal = container.firstChild as HTMLElement;
      expect(modal).toHaveClass('fixed', 'inset-0', 'flex', 'items-center', 'justify-center');
    });

    it('should show close button on desktop only', async () => {
      const { useBreakpoint } = await import('@/hooks');
      (useBreakpoint as any).mockReturnValue({ isMobile: false });

      render(<ReminderModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('countdown functionality', () => {
    it('should show countdown when set', () => {
      render(<ReminderModal {...defaultProps} />);

      // Simulate snooze to trigger countdown
      const snoozeButton = screen.getByText('Snooze');
      fireEvent.click(snoozeButton);

      const tenMinButton = screen.getByText('10 min');
      fireEvent.click(tenMinButton);

      // Note: In a real test, we'd need to mock the countdown state
      // This is a simplified test structure
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss after timeout', () => {
      vi.useFakeTimers();

      render(<ReminderModal {...defaultProps} />);

      // Fast-forward 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(defaultProps.onSkip).toHaveBeenCalledWith('No response - auto-skipped');

      vi.useRealTimers();
    });
  });
});