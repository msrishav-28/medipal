import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { OfflineIndicator } from '../OfflineIndicator';
import { offlineSyncService } from '@/services/offlineSyncService';

// Mock the offline sync service
vi.mock('@/services/offlineSyncService', () => ({
  offlineSyncService: {
    getPendingCount: vi.fn(),
  },
}));

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when online with no pending actions', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    const { container } = render(<OfflineIndicator />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    render(<OfflineIndicator />);

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  it('should render when online with pending actions', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(5);

    render(<OfflineIndicator />);

    await waitFor(() => {
      expect(screen.getByText('Syncing 5')).toBeInTheDocument();
    });
  });

  it('should show details when clicked', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    render(<OfflineIndicator />);

    const button = await screen.findByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Offline Mode')).toBeInTheDocument();
    });
  });

  it('should hide details when close is clicked', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    render(<OfflineIndicator />);

    const button = await screen.findByRole('button');
    fireEvent.click(button);

    const closeButton = await screen.findByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Offline Mode')).not.toBeInTheDocument();
    });
  });

  it('should display offline features list when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    render(<OfflineIndicator />);

    const button = await screen.findByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('What you can do offline:')).toBeInTheDocument();
      expect(screen.getByText('View your medications')).toBeInTheDocument();
      expect(screen.getByText('Log medication intakes')).toBeInTheDocument();
    });
  });

  it('should display pending actions count', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(3);

    render(<OfflineIndicator />);

    const button = await screen.findByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Pending Actions:/)).toBeInTheDocument();
      // Use a more specific text matcher to avoid multiple matches
      expect(screen.getByText(/You have 3 actions waiting to sync/)).toBeInTheDocument();
    });
  });

  it('should update status when going online', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    render(<OfflineIndicator />);

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    fireEvent(window, new Event('online'));

    await waitFor(() => {
      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    });
  });

  it('should update status when going offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    (offlineSyncService.getPendingCount as any).mockResolvedValue(0);

    const { container } = render(<OfflineIndicator />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  it('should poll for pending count updates', async () => {
    vi.useFakeTimers();

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    (offlineSyncService.getPendingCount as any)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);

    render(<OfflineIndicator />);

    // Wait for initial render and first getPendingCount call
    await act(async () => {
      await Promise.resolve();
    });

    // Advance timer by 5 seconds to trigger polling
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText('Syncing 2')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
