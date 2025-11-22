import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { createTestMedication, createTestIntakeRecord } from '@/test/testUtils';

// Mock hooks
vi.mock('@/hooks/useUser', () => ({
  useCurrentUser: vi.fn(() => ({
    data: { id: 'user-123' },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useIntakeRecords', () => ({
  useIntakeRecordsByDateRange: vi.fn(() => ({
    data: [
      createTestIntakeRecord({ id: '1', status: 'taken' }),
      createTestIntakeRecord({ id: '2', status: 'missed' }),
    ],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useMedications', () => ({
  useMedications: vi.fn(() => ({
    data: [
      createTestMedication({ id: 'med-1', name: 'Aspirin' }),
    ],
    isLoading: false,
  })),
}));

describe('AnalyticsDashboard', () => {
  it('should render analytics dashboard with tabs', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should handle user not loaded', () => {
    const { useCurrentUser } = require('@/hooks/useUser');
    useCurrentUser.mockReturnValueOnce({ data: null, isLoading: false });

    render(<AnalyticsDashboard />);

    expect(screen.getByText(/Please log in/i) || screen.getByText(/Loading/i)).toBeTruthy();
  });
});

