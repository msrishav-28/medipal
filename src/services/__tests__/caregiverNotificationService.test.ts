import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { caregiverNotificationService } from '../caregiverNotificationService';
import { caregiverNotificationRepository } from '../caregiverNotificationRepository';
import { caregiverRepository } from '../caregiverRepository';
import type { Caregiver, Medication, IntakeRecord } from '../../types';

// Mock the repositories
vi.mock('../caregiverNotificationRepository', () => ({
  caregiverNotificationRepository: {
    addNotification: vi.fn(),
    getNotificationsByCaregiver: vi.fn(),
    markAsRead: vi.fn(),
    addDelivery: vi.fn(),
    getPendingDeliveries: vi.fn(),
    markDeliveryAsSent: vi.fn(),
  }
}));

vi.mock('../caregiverRepository', () => ({
  caregiverRepository: {
    getCaregiverByPatient: vi.fn(),
  }
}));

vi.mock('../database', () => ({
  databaseService: {
    medications: {
      where: vi.fn(),
    },
    intakeRecords: {
      where: vi.fn(),
    }
  }
}));

describe('caregiverNotificationService', () => {
  let intervalId: NodeJS.Timeout | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    vi.useRealTimers();
  });

  describe('sendMissedDoseAlert', () => {
    const mockCaregiver: Caregiver = {
      id: 'caregiver-1',
      patientId: 'patient-1',
      name: 'John Doe',
      email: 'john@example.com',
      relationship: 'spouse',
      accessLevel: 'view',
      notificationPreferences: {
        missedDose: true,
        criticalMedication: true,
        weeklyReport: true,
        smsEnabled: false,
        emailEnabled: true
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockMedication: Medication = {
      id: 'med-1',
      userId: 'patient-1',
      name: 'Aspirin',
      dosage: '100mg',
      form: 'tablet',
      scheduleType: 'time-based',
      times: ['08:00'],
      startDate: new Date(),
      refillReminder: true,
      totalPills: 30,
      remainingPills: 20,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should send missed dose alert to caregivers with preference enabled', async () => {
      vi.mocked(caregiverRepository.getCaregiverByPatient).mockResolvedValue([mockCaregiver]);
      vi.mocked(caregiverNotificationRepository.addNotification).mockResolvedValue('notif-1');
      vi.mocked(caregiverNotificationRepository.addDelivery).mockResolvedValue('delivery-1');

      await caregiverNotificationService.sendMissedDoseAlert(
        'patient-1',
        mockMedication,
        new Date()
      );

      expect(caregiverNotificationRepository.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          caregiverId: 'caregiver-1',
          patientId: 'patient-1',
          type: 'missed-dose',
          severity: 'warning',
          title: 'Missed Medication Dose',
          isRead: false
        })
      );

      expect(caregiverNotificationRepository.addDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryMethod: 'email',
          status: 'pending'
        })
      );
    });

    it('should not send to caregivers with missedDose preference disabled', async () => {
      const caregiverNoMissedDose: Caregiver = {
        ...mockCaregiver,
        notificationPreferences: {
          missedDose: false,
          criticalMedication: true,
          weeklyReport: true,
          smsEnabled: false,
          emailEnabled: true
        }
      };

      vi.mocked(caregiverRepository.getCaregiverByPatient).mockResolvedValue([caregiverNoMissedDose]);

      await caregiverNotificationService.sendMissedDoseAlert(
        'patient-1',
        mockMedication,
        new Date()
      );

      expect(caregiverNotificationRepository.addNotification).not.toHaveBeenCalled();
    });

    it('should not send to inactive caregivers', async () => {
      const inactiveCaregiver: Caregiver = {
        ...mockCaregiver,
        isActive: false
      };

      vi.mocked(caregiverRepository.getCaregiverByPatient).mockResolvedValue([inactiveCaregiver]);

      await caregiverNotificationService.sendMissedDoseAlert(
        'patient-1',
        mockMedication,
        new Date()
      );

      expect(caregiverNotificationRepository.addNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendCriticalMedicationAlert', () => {
    const mockCaregiver: Caregiver = {
      id: 'caregiver-1',
      patientId: 'patient-1',
      name: 'John Doe',
      email: 'john@example.com',
      relationship: 'spouse',
      accessLevel: 'view',
      notificationPreferences: {
        missedDose: true,
        criticalMedication: true,
        weeklyReport: true,
        smsEnabled: true,
        emailEnabled: true
      },
      phone: '+1234567890',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should send critical alert with high priority', async () => {
      vi.mocked(caregiverRepository.getCaregiverByPatient).mockResolvedValue([mockCaregiver]);
      vi.mocked(caregiverNotificationRepository.addNotification).mockResolvedValue('notif-1');
      vi.mocked(caregiverNotificationRepository.addDelivery).mockResolvedValue('delivery-1');

      await caregiverNotificationService.sendCriticalMedicationAlert(
        'patient-1',
        'Critical medication alert message'
      );

      expect(caregiverNotificationRepository.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'critical-medication',
          severity: 'critical',
          title: 'Critical Medication Alert'
        })
      );
    });

    it('should queue both SMS and email when both enabled', async () => {
      vi.mocked(caregiverRepository.getCaregiverByPatient).mockResolvedValue([mockCaregiver]);
      vi.mocked(caregiverNotificationRepository.addNotification).mockResolvedValue('notif-1');
      vi.mocked(caregiverNotificationRepository.addDelivery).mockResolvedValue('delivery-1');

      await caregiverNotificationService.sendCriticalMedicationAlert(
        'patient-1',
        'Critical alert'
      );

      expect(caregiverNotificationRepository.addDelivery).toHaveBeenCalledTimes(2);
      expect(caregiverNotificationRepository.addDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryMethod: 'email'
        })
      );
      expect(caregiverNotificationRepository.addDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryMethod: 'sms'
        })
      );
    });
  });

  describe('sendWeeklyReport', () => {
    const mockCaregiver: Caregiver = {
      id: 'caregiver-1',
      patientId: 'patient-1',
      name: 'John Doe',
      email: 'john@example.com',
      relationship: 'spouse',
      accessLevel: 'view',
      notificationPreferences: {
        missedDose: true,
        criticalMedication: true,
        weeklyReport: true,
        smsEnabled: false,
        emailEnabled: true
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should send weekly report to caregivers with preference enabled', async () => {
      vi.mocked(caregiverRepository.getCaregiverByPatient).mockResolvedValue([mockCaregiver]);
      vi.mocked(caregiverNotificationRepository.addNotification).mockResolvedValue('notif-1');
      vi.mocked(caregiverNotificationRepository.addDelivery).mockResolvedValue('delivery-1');

      await caregiverNotificationService.sendWeeklyReport('patient-1', {
        adherenceRate: 85.5,
        missedDoses: 3,
        takenDoses: 18
      });

      expect(caregiverNotificationRepository.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'weekly-report',
          severity: 'info',
          title: 'Weekly Adherence Report'
        })
      );
    });

    it('should not send to caregivers with weeklyReport preference disabled', async () => {
      const caregiverNoReport: Caregiver = {
        ...mockCaregiver,
        notificationPreferences: {
          missedDose: true,
          criticalMedication: true,
          weeklyReport: false,
          smsEnabled: false,
          emailEnabled: true
        }
      };

      vi.mocked(caregiverRepository.getCaregiverByPatient).mockResolvedValue([caregiverNoReport]);

      await caregiverNotificationService.sendWeeklyReport('patient-1', {
        adherenceRate: 85.5,
        missedDoses: 3,
        takenDoses: 18
      });

      expect(caregiverNotificationRepository.addNotification).not.toHaveBeenCalled();
    });
  });

  describe('processPendingDeliveries', () => {
    it('should process pending deliveries and mark as sent', async () => {
      const mockDeliveries = [
        {
          id: 'delivery-1',
          notificationId: 'notif-1',
          deliveryMethod: 'email' as const,
          recipientAddress: 'john@example.com',
          status: 'pending' as const,
          createdAt: new Date()
        },
        {
          id: 'delivery-2',
          notificationId: 'notif-2',
          deliveryMethod: 'sms' as const,
          recipientAddress: '+1234567890',
          status: 'pending' as const,
          createdAt: new Date()
        }
      ];

      vi.mocked(caregiverNotificationRepository.getPendingDeliveries).mockResolvedValue(mockDeliveries);
      vi.mocked(caregiverNotificationRepository.markDeliveryAsSent).mockResolvedValue(1);

      await caregiverNotificationService.processPendingDeliveries();

      expect(caregiverNotificationRepository.markDeliveryAsSent).toHaveBeenCalledTimes(2);
      expect(caregiverNotificationRepository.markDeliveryAsSent).toHaveBeenCalledWith('delivery-1');
      expect(caregiverNotificationRepository.markDeliveryAsSent).toHaveBeenCalledWith('delivery-2');
    });

    it('should handle delivery errors gracefully', async () => {
      const mockDeliveries = [
        {
          id: 'delivery-1',
          notificationId: 'notif-1',
          deliveryMethod: 'email' as const,
          recipientAddress: 'john@example.com',
          status: 'pending' as const,
          createdAt: new Date()
        }
      ];

      vi.mocked(caregiverNotificationRepository.getPendingDeliveries).mockResolvedValue(mockDeliveries);
      vi.mocked(caregiverNotificationRepository.markDeliveryAsSent).mockRejectedValue(
        new Error('Delivery failed')
      );

      // Should not throw
      await expect(caregiverNotificationService.processPendingDeliveries()).resolves.not.toThrow();
    });
  });

  describe('getNotificationsForCaregiver', () => {
    it('should return notifications for a caregiver', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          caregiverId: 'caregiver-1',
          patientId: 'patient-1',
          type: 'missed-dose' as const,
          severity: 'warning' as const,
          title: 'Missed Dose',
          message: 'Patient missed a dose',
          isRead: false,
          createdAt: new Date()
        }
      ];

      vi.mocked(caregiverNotificationRepository.getNotificationsByCaregiver).mockResolvedValue(mockNotifications);

      const result = await caregiverNotificationService.getNotificationsForCaregiver('caregiver-1');

      expect(result).toEqual(mockNotifications);
      expect(caregiverNotificationRepository.getNotificationsByCaregiver).toHaveBeenCalledWith('caregiver-1', false);
    });

    it('should filter unread notifications when requested', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          caregiverId: 'caregiver-1',
          patientId: 'patient-1',
          type: 'missed-dose' as const,
          severity: 'warning' as const,
          title: 'Missed Dose',
          message: 'Patient missed a dose',
          isRead: false,
          createdAt: new Date()
        }
      ];

      vi.mocked(caregiverNotificationRepository.getNotificationsByCaregiver).mockResolvedValue(mockNotifications);

      const result = await caregiverNotificationService.getNotificationsForCaregiver('caregiver-1', true);

      expect(result).toEqual(mockNotifications);
      expect(caregiverNotificationRepository.getNotificationsByCaregiver).toHaveBeenCalledWith('caregiver-1', true);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      vi.mocked(caregiverNotificationRepository.markAsRead).mockResolvedValue(1);

      await caregiverNotificationService.markNotificationAsRead('notif-1');

      expect(caregiverNotificationRepository.markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });
});
