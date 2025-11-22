import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CaregiverNotifications } from '../CaregiverNotifications';
import { caregiverNotificationService } from '@/services/caregiverNotificationService';
import { CaregiverNotification } from '@/types/notification';

// Mock the notification service
vi.mock('@/services/caregiverNotificationService', () => ({
  caregiverNotificationService: {
    getNotificationsForCaregiver: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

describe('CaregiverNotifications', () => {
  const mockCaregiverId = 'caregiver-123';

  const mockNotifications: CaregiverNotification[] = [
    {
      id: 'notif-1',
      caregiverId: mockCaregiverId,
      patientId: 'patient-123',
      type: 'missed-dose',
      severity: 'warning',
      title: 'Missed Dose Alert',
      message: 'Patient missed morning medication',
      medicationName: 'Aspirin',
      scheduledTime: new Date('2024-01-01T08:00:00'),
      isRead: false,
      isSent: true,
      sentAt: new Date('2024-01-01T08:30:00'),
      createdAt: new Date('2024-01-01T08:30:00'),
    },
    {
      id: 'notif-2',
      caregiverId: mockCaregiverId,
      patientId: 'patient-123',
      type: 'weekly-report',
      severity: 'info',
      title: 'Weekly Adherence Report',
      message: 'Patient adherence rate: 95% this week',
      isRead: true,
      isSent: true,
      sentAt: new Date('2024-01-01T09:00:00'),
      createdAt: new Date('2024-01-01T09:00:00'),
    },
    {
      id: 'notif-3',
      caregiverId: mockCaregiverId,
      patientId: 'patient-123',
      type: 'critical-medication',
      severity: 'critical',
      title: 'Critical Medication Alert',
      message: 'Patient needs immediate assistance',
      medicationName: 'Insulin',
      scheduledTime: new Date('2024-01-01T12:00:00'),
      isRead: false,
      isSent: true,
      sentAt: new Date('2024-01-01T12:05:00'),
      createdAt: new Date('2024-01-01T12:05:00'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(caregiverNotificationService.getNotificationsForCaregiver).mockResolvedValue(
      mockNotifications
    );
    vi.mocked(caregiverNotificationService.getUnreadCount).mockResolvedValue(2);
  });

  it('should render notifications list', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Missed Dose Alert')).toBeInTheDocument();
      expect(screen.getByText('Weekly Adherence Report')).toBeInTheDocument();
      expect(screen.getByText('Critical Medication Alert')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    vi.mocked(caregiverNotificationService.getNotificationsForCaregiver).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    vi.mocked(caregiverNotificationService.getUnreadCount).mockImplementation(
      () => new Promise(() => {})
    );

    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('should display unread count', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('2 unread notifications')).toBeInTheDocument();
    });
  });

  it('should show notification details', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Patient missed morning medication')).toBeInTheDocument();
      expect(screen.getByText('Medication: Aspirin')).toBeInTheDocument();
    });
  });

  it('should display severity badges correctly', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Missed Dose')).toBeInTheDocument();
      expect(screen.getByText('Weekly Report')).toBeInTheDocument();
      expect(screen.getByText('Critical Alert')).toBeInTheDocument();
    });
  });

  it('should mark unread notifications with "New" badge', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      const newBadges = screen.getAllByText('New');
      expect(newBadges).toHaveLength(2); // Two unread notifications
    });
  });

  it('should filter notifications by unread', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    // Click unread filter button
    const unreadButton = screen.getByRole('button', { name: /unread \(2\)/i });
    fireEvent.click(unreadButton);

    // Weekly Report should not be visible (it's read)
    await waitFor(() => {
      expect(screen.queryByText('Weekly Adherence Report')).not.toBeInTheDocument();
      expect(screen.getByText('Missed Dose Alert')).toBeInTheDocument();
      expect(screen.getByText('Critical Medication Alert')).toBeInTheDocument();
    });
  });

  it('should filter notifications to show all', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    // First filter to unread
    const unreadButton = screen.getByRole('button', { name: /unread \(2\)/i });
    fireEvent.click(unreadButton);

    // Then back to all
    const allButton = screen.getByRole('button', { name: /^all$/i });
    fireEvent.click(allButton);

    await waitFor(() => {
      expect(screen.getByText('Missed Dose Alert')).toBeInTheDocument();
      expect(screen.getByText('Weekly Adherence Report')).toBeInTheDocument();
      expect(screen.getByText('Critical Medication Alert')).toBeInTheDocument();
    });
  });

  it('should mark notification as read', async () => {
    vi.mocked(caregiverNotificationService.markAsRead).mockResolvedValue();

    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Missed Dose Alert')).toBeInTheDocument();
    });

    // Find and click mark as read button (should be multiple)
    const markAsReadButtons = screen.getAllByRole('button', { name: /mark as read/i });
    fireEvent.click(markAsReadButtons[0]);

    await waitFor(() => {
      expect(caregiverNotificationService.markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('should reload notifications after marking as read', async () => {
    vi.mocked(caregiverNotificationService.markAsRead).mockResolvedValue();

    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Missed Dose Alert')).toBeInTheDocument();
    });

    // Clear previous calls
    vi.mocked(caregiverNotificationService.getNotificationsForCaregiver).mockClear();
    vi.mocked(caregiverNotificationService.getUnreadCount).mockClear();

    // Mark as read
    const markAsReadButtons = screen.getAllByRole('button', { name: /mark as read/i });
    fireEvent.click(markAsReadButtons[0]);

    await waitFor(() => {
      expect(caregiverNotificationService.getNotificationsForCaregiver).toHaveBeenCalledWith(
        mockCaregiverId
      );
      expect(caregiverNotificationService.getUnreadCount).toHaveBeenCalledWith(mockCaregiverId);
    });
  });

  it('should show empty state for no notifications', async () => {
    vi.mocked(caregiverNotificationService.getNotificationsForCaregiver).mockResolvedValue([]);
    vi.mocked(caregiverNotificationService.getUnreadCount).mockResolvedValue(0);

    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('should show empty state for no unread notifications when filtered', async () => {
    vi.mocked(caregiverNotificationService.getNotificationsForCaregiver).mockResolvedValue([
      mockNotifications[1], // Only the read notification
    ]);
    vi.mocked(caregiverNotificationService.getUnreadCount).mockResolvedValue(0);

    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    // Click unread filter
    const unreadButton = screen.getByRole('button', { name: /unread/i });
    fireEvent.click(unreadButton);

    await waitFor(() => {
      expect(screen.getByText('No unread notifications')).toBeInTheDocument();
    });
  });

  it('should display scheduled time for notifications', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getAllByText(/Scheduled:/)).toHaveLength(2);
    });
  });

  it('should not show mark as read button for read notifications', async () => {
    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Adherence Report')).toBeInTheDocument();
    });

    // Should have 2 mark as read buttons (for the 2 unread notifications)
    const markAsReadButtons = screen.getAllByRole('button', { name: /mark as read/i });
    expect(markAsReadButtons).toHaveLength(2);
  });

  it('should handle errors when loading notifications', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(caregiverNotificationService.getNotificationsForCaregiver).mockRejectedValue(
      new Error('Failed to load notifications')
    );

    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('should handle errors when marking as read', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.mocked(caregiverNotificationService.markAsRead).mockRejectedValue(
      new Error('Failed to mark as read')
    );

    render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Missed Dose Alert')).toBeInTheDocument();
    });

    const markAsReadButtons = screen.getAllByRole('button', { name: /mark as read/i });
    fireEvent.click(markAsReadButtons[0]);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('should apply special styling to unread notifications', async () => {
    const { container } = render(<CaregiverNotifications caregiverId={mockCaregiverId} />);

    await waitFor(() => {
      expect(screen.getByText('Missed Dose Alert')).toBeInTheDocument();
    });

    // Find cards with blue border (unread styling)
    const cards = container.querySelectorAll('.border-blue-500');
    expect(cards.length).toBeGreaterThan(0);
  });
});
