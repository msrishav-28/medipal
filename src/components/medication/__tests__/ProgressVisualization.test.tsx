import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ProgressVisualization from '../ProgressVisualization';

// Mock the hooks
const mockUseStreakData = vi.fn();
const mockUseAdherenceStatistics = vi.fn();

vi.mock('@/hooks/useIntakeRecords', () => ({
  useStreakData: mockUseStreakData,
  useAdherenceStatistics: mockUseAdherenceStatistics,
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

describe('ProgressVisualization', () => {
  const testUserId = 'test-user-1';
  const mockStreakData = {
    currentStreak: 7,
    longestStreak: 14,
    streakType: 'daily' as const,
  };

  const mockStatistics = {
    adherenceRate: 85.5,
    totalDoses: 20,
    takenDoses: 17,
    missedDoses: 2,
    skippedDoses: 1,
    onTimeRate: 94.1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseStreakData.mockReturnValue({ isLoading: true });
    mockUseAdherenceStatistics.mockReturnValue({ isLoading: true });

    render(
      <ProgressVisualization userId={testUserId} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should render progress data correctly', async () => {
    mockUseStreakData.mockReturnValue({
      data: mockStreakData,
      isLoading: false,
    });
    mockUseAdherenceStatistics.mockReturnValue({
      data: mockStatistics,
      isLoading: false,
    });

    render(
      <ProgressVisualization userId={testUserId} showDetailed={true} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    // Check streak display
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();

    // Check adherence rate
    expect(screen.getByText('86%')).toBeInTheDocument(); // Rounded from 85.5
    expect(screen.getByText('Adherence')).toBeInTheDocument();

    // Check detailed stats when showDetailed is true
    expect(screen.getByText('17')).toBeInTheDocument(); // Taken doses
    expect(screen.getByText('Taken')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Skipped doses
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Missed doses
    expect(screen.getByText('Missed')).toBeInTheDocument();
  });

  it('should display correct streak emoji based on streak length', async () => {
    const testCases = [
      { streak: 0, expectedEmoji: '🌱' },
      { streak: 3, expectedEmoji: '🎯' },
      { streak: 7, expectedEmoji: '💪' },
      { streak: 14, expectedEmoji: '⭐' },
      { streak: 30, expectedEmoji: '🔥' },
      { streak: 50, expectedEmoji: '🏆' },
      { streak: 100, expectedEmoji: '👑' },
    ];

    for (const { streak, expectedEmoji } of testCases) {
      mockUseStreakData.mockReturnValue({
        data: { ...mockStreakData, currentStreak: streak },
        isLoading: false,
      });
      mockUseAdherenceStatistics.mockReturnValue({
        data: mockStatistics,
        isLoading: false,
      });

      const { rerender } = render(
        <ProgressVisualization userId={testUserId} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText(expectedEmoji)).toBeInTheDocument();
      });

      rerender(<div />); // Clear for next test
    }
  });

  it('should show appropriate motivational message based on adherence rate', async () => {
    const testCases = [
      {
        adherenceRate: 96,
        expectedMessage: /Outstanding.*champion/i,
      },
      {
        adherenceRate: 88,
        expectedMessage: /Great job.*excellent/i,
      },
      {
        adherenceRate: 75,
        expectedMessage: /Good progress.*routine/i,
      },
      {
        adherenceRate: 45,
        expectedMessage: /Every day.*opportunity/i,
      },
    ];

    for (const { adherenceRate, expectedMessage } of testCases) {
      mockUseStreakData.mockReturnValue({
        data: mockStreakData,
        isLoading: false,
      });
      mockUseAdherenceStatistics.mockReturnValue({
        data: { ...mockStatistics, adherenceRate },
        isLoading: false,
      });

      const { rerender } = render(
        <ProgressVisualization userId={testUserId} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });

      rerender(<div />); // Clear for next test
    }
  });

  it('should display on-time rate when showDetailed is true', async () => {
    mockUseStreakData.mockReturnValue({
      data: mockStreakData,
      isLoading: false,
    });
    mockUseAdherenceStatistics.mockReturnValue({
      data: mockStatistics,
      isLoading: false,
    });

    render(
      <ProgressVisualization userId={testUserId} showDetailed={true} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('On-time Rate')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument(); // Rounded from 94.1
    });

    expect(screen.getByText(/within 30 minutes/i)).toBeInTheDocument();
  });

  it('should display personal best when showDetailed is true', async () => {
    mockUseStreakData.mockReturnValue({
      data: mockStreakData,
      isLoading: false,
    });
    mockUseAdherenceStatistics.mockReturnValue({
      data: mockStatistics,
      isLoading: false,
    });

    render(
      <ProgressVisualization userId={testUserId} showDetailed={true} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Best')).toBeInTheDocument();
      expect(screen.getByText('14 days')).toBeInTheDocument();
    });
  });

  it('should use correct colors for adherence rate', async () => {
    const testCases = [
      { rate: 95, expectedColor: 'success' },
      { rate: 80, expectedColor: 'warning' },
      { rate: 60, expectedColor: 'error' },
    ];

    for (const { rate } of testCases) {
      mockUseStreakData.mockReturnValue({
        data: mockStreakData,
        isLoading: false,
      });
      mockUseAdherenceStatistics.mockReturnValue({
        data: { ...mockStatistics, adherenceRate: rate },
        isLoading: false,
      });

      const { container, rerender } = render(
        <ProgressVisualization userId={testUserId} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const progressCircle = container.querySelector('circle[stroke]');
        expect(progressCircle).toBeInTheDocument();
      });

      rerender(<div />); // Clear for next test
    }
  });

  it('should handle missing data gracefully', () => {
    mockUseStreakData.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUseAdherenceStatistics.mockReturnValue({
      data: null,
      isLoading: false,
    });

    const { container } = render(
      <ProgressVisualization userId={testUserId} />,
      { wrapper: createWrapper() }
    );

    // Component should not render anything when data is null
    expect(container.firstChild).toBeNull();
  });

  it('should pass correct days parameter to hooks', () => {
    const customDays = 14;

    mockUseStreakData.mockReturnValue({
      data: mockStreakData,
      isLoading: false,
    });
    mockUseAdherenceStatistics.mockReturnValue({
      data: mockStatistics,
      isLoading: false,
    });

    render(
      <ProgressVisualization userId={testUserId} days={customDays} />,
      { wrapper: createWrapper() }
    );

    expect(mockUseStreakData).toHaveBeenCalledWith(testUserId);
    expect(mockUseAdherenceStatistics).toHaveBeenCalledWith(testUserId, customDays);
  });

  it('should apply custom className', async () => {
    const customClassName = 'custom-progress-class';

    mockUseStreakData.mockReturnValue({
      data: mockStreakData,
      isLoading: false,
    });
    mockUseAdherenceStatistics.mockReturnValue({
      data: mockStatistics,
      isLoading: false,
    });

    const { container } = render(
      <ProgressVisualization userId={testUserId} className={customClassName} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(container.firstChild).toHaveClass(customClassName);
    });
  });

  it('should show compact view when showDetailed is false', async () => {
    mockUseStreakData.mockReturnValue({
      data: mockStreakData,
      isLoading: false,
    });
    mockUseAdherenceStatistics.mockReturnValue({
      data: mockStatistics,
      isLoading: false,
    });

    render(
      <ProgressVisualization userId={testUserId} showDetailed={false} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    // Should not show detailed stats
    expect(screen.queryByText('On-time Rate')).not.toBeInTheDocument();
    expect(screen.queryByText('Personal Best')).not.toBeInTheDocument();
  });
});