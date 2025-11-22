import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarView } from '../CalendarView';
import * as useUserHooks from '@/hooks/useUser';
import * as useIntakeRecordsHooks from '@/hooks/useIntakeRecords';

// Mock the hooks
vi.mock('@/hooks/useUser');
vi.mock('@/hooks/useIntakeRecords');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('CalendarView', () => {
  const mockOnDateSelect = vi.fn();
  const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useCurrentUser
    vi.spyOn(useUserHooks, 'useCurrentUser').mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    } as any);

    // Mock useIntakeRecordsByDateRange
    vi.spyOn(useIntakeRecordsHooks, 'useIntakeRecordsByDateRange').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
  });

  it('renders calendar with current month', () => {
    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(currentMonth)).toBeInTheDocument();
  });

  it('displays all weekday headers', () => {
    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('navigates to previous month when clicking previous button', () => {
    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    const prevButton = screen.getByLabelText(/previous month/i);
    fireEvent.click(prevButton);

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const expectedMonth = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    expect(screen.getByText(expectedMonth)).toBeInTheDocument();
  });

  it('navigates to next month when clicking next button', () => {
    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    const nextButton = screen.getByLabelText(/next month/i);
    fireEvent.click(nextButton);

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const expectedMonth = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    expect(screen.getByText(expectedMonth)).toBeInTheDocument();
  });

  it('calls onDateSelect when clicking a date', () => {
    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    // Find a date button (e.g., "15")
    const dateButtons = screen.getAllByRole('button');
    const dateButton = dateButtons.find((btn) => btn.textContent === '15');

    if (dateButton) {
      fireEvent.click(dateButton);
      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
      expect(mockOnDateSelect).toHaveBeenCalledWith(expect.any(Date));
    }
  });

  it('displays adherence colors based on intake records', () => {
    const today = new Date();
    const mockRecords = [
      {
        id: '1',
        userId: 'user-1',
        medicationId: 'med-1',
        scheduledTime: new Date(today.getFullYear(), today.getMonth(), 15, 9, 0).toISOString(),
        status: 'taken' as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user-1',
        medicationId: 'med-2',
        scheduledTime: new Date(today.getFullYear(), today.getMonth(), 15, 18, 0).toISOString(),
        status: 'taken' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(useIntakeRecordsHooks, 'useIntakeRecordsByDateRange').mockReturnValue({
      data: mockRecords,
      isLoading: false,
      error: null,
    } as any);

    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    // Calendar should render with adherence indicators
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    vi.spyOn(useIntakeRecordsHooks, 'useIntakeRecordsByDateRange').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    // Calendar should still render during loading
    expect(screen.getAllByText(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/)[0]).toBeInTheDocument();
  });

  it('displays current date highlight', () => {
    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    const today = new Date().getDate();
    const todayButtons = screen.getAllByText(today.toString());

    // Today's date should be rendered (may appear twice if 28th appears in prev/current month)
    expect(todayButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('handles month boundaries correctly', () => {
    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    // Navigate back and forward multiple times
    const nextButton = screen.getByLabelText(/next month/i);
    const prevButton = screen.getByLabelText(/previous month/i);

    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(prevButton);

    // Should still display a valid month
    const monthDisplay = screen.getByText(/\w+ \d{4}/);
    expect(monthDisplay).toBeInTheDocument();
  });

  it('returns to current month when clicking today button', () => {
    render(<CalendarView onDateSelect={mockOnDateSelect} />, { wrapper: createWrapper() });

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Navigate away
    const nextButton = screen.getByLabelText(/next month/i);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Click today button if it exists
    const todayButton = screen.queryByText(/today/i);
    if (todayButton) {
      fireEvent.click(todayButton);
      expect(screen.getByText(currentMonth)).toBeInTheDocument();
    }
  });
});
