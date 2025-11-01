import { db } from './database';
import { caregiverService } from './caregiverService';
import { caregiverNotificationRepository } from './caregiverNotificationRepository';
import { CaregiverNotification, CaregiverNotificationDelivery } from '../types/notification';
import { Caregiver } from '../types';

/**
 * Service for managing caregiver notifications
 */
class CaregiverNotificationService {
  /**
   * Create a notification for caregivers
   */
  async createNotification(
    patientId: string,
    type: CaregiverNotification['type'],
    data: {
      title: string;
      message: string;
      severity: CaregiverNotification['severity'];
      medicationId?: string;
      medicationName?: string;
      scheduledTime?: Date;
    }
  ): Promise<CaregiverNotification[]> {
    // Get all active caregivers for the patient
    const caregivers = await caregiverService.getCaregiversForPatient(patientId);
    const activeCaregivers = caregivers.filter(c => c.isActive);

    const notifications: CaregiverNotification[] = [];

    for (const caregiver of activeCaregivers) {
      // Check if caregiver wants this type of notification
      if (!this.shouldNotifyCaregiver(caregiver, type)) {
        continue;
      }

      const notification: CaregiverNotification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        caregiverId: caregiver.id,
        patientId,
        type,
        title: data.title,
        message: data.message,
        severity: data.severity,
        isRead: false,
        isSent: false,
        createdAt: new Date()
      };

      if (data.medicationId) {
        notification.medicationId = data.medicationId;
      }
      if (data.medicationName) {
        notification.medicationName = data.medicationName;
      }
      if (data.scheduledTime) {
        notification.scheduledTime = data.scheduledTime;
      }

      // Store notification
      await caregiverNotificationRepository.addNotification(notification);

      notifications.push(notification);

      // Queue delivery for enabled channels
      await this.queueDelivery(notification, caregiver);
    }

    return notifications;
  }

  /**
   * Check if caregiver should receive this type of notification
   */
  private shouldNotifyCaregiver(caregiver: Caregiver, type: CaregiverNotification['type']): boolean {
    const prefs = caregiver.notificationPreferences;

    switch (type) {
      case 'missed-dose':
        return prefs.missedDose;
      case 'critical-medication':
        return prefs.criticalMedication;
      case 'weekly-report':
        return prefs.weeklyReport;
      case 'emergency':
        return true; // Always notify on emergency
      default:
        return false;
    }
  }

  /**
   * Queue notification delivery via enabled channels
   */
  private async queueDelivery(notification: CaregiverNotification, caregiver: Caregiver): Promise<void> {
    const prefs = caregiver.notificationPreferences;

    // Email delivery
    if (prefs.emailEnabled && caregiver.email) {
      await this.createDelivery(notification.id, caregiver.id, 'email', caregiver.email);
    }

    // SMS delivery
    if (prefs.smsEnabled && caregiver.phone) {
      await this.createDelivery(notification.id, caregiver.id, 'sms', caregiver.phone);
    }

    // Push notification (if supported in future)
    // For now, we'll skip push notifications
  }

  /**
   * Create a delivery record
   */
  private async createDelivery(
    notificationId: string,
    caregiverId: string,
    deliveryMethod: 'email' | 'sms' | 'push',
    recipient: string
  ): Promise<void> {
    const delivery: CaregiverNotificationDelivery = {
      id: `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notificationId,
      caregiverId,
      deliveryMethod,
      status: 'pending',
      recipient,
      createdAt: new Date()
    };

    await caregiverNotificationRepository.addDelivery(delivery);
  }

  /**
   * Send a missed dose alert to caregivers
   */
  async sendMissedDoseAlert(
    patientId: string,
    medicationName: string,
    medicationId: string,
    scheduledTime: Date
  ): Promise<void> {
    const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    await this.createNotification(patientId, 'missed-dose', {
      title: 'Missed Medication Dose',
      message: `${medicationName} dose at ${formattedTime} was missed.`,
      severity: 'warning',
      medicationId,
      medicationName,
      scheduledTime
    });

    // Process pending deliveries
    await this.processPendingDeliveries();
  }

  /**
   * Send critical medication alert to caregivers
   */
  async sendCriticalMedicationAlert(
    patientId: string,
    medicationName: string,
    medicationId: string,
    reason: string
  ): Promise<void> {
    await this.createNotification(patientId, 'critical-medication', {
      title: 'Critical Medication Alert',
      message: `${medicationName}: ${reason}`,
      severity: 'critical',
      medicationId,
      medicationName
    });

    // Process deliveries immediately for critical alerts
    await this.processPendingDeliveries();
  }

  /**
   * Send weekly adherence report to caregivers
   */
  async sendWeeklyReport(
    patientId: string,
    adherenceRate: number,
    missedDoses: number,
    totalDoses: number
  ): Promise<void> {
    const message = `Weekly adherence: ${adherenceRate.toFixed(1)}%. ${missedDoses} of ${totalDoses} doses missed.`;

    await this.createNotification(patientId, 'weekly-report', {
      title: 'Weekly Medication Report',
      message,
      severity: adherenceRate >= 90 ? 'info' : adherenceRate >= 75 ? 'warning' : 'critical'
    });

    await this.processPendingDeliveries();
  }

  /**
   * Process pending deliveries
   */
  async processPendingDeliveries(): Promise<void> {
    const pendingDeliveries = await caregiverNotificationRepository.getPendingDeliveries();

    for (const delivery of pendingDeliveries) {
      try {
        await this.sendDelivery(delivery);
      } catch (error) {
        console.error('Failed to send delivery:', error);
        await caregiverNotificationRepository.updateDelivery(delivery.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Send a single delivery
   */
  private async sendDelivery(delivery: CaregiverNotificationDelivery): Promise<void> {
    // Get the notification details
    const notification = await caregiverNotificationRepository.getNotification(delivery.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Simulate delivery (in production, this would call external APIs)
    console.log(`[CAREGIVER NOTIFICATION] ${delivery.deliveryMethod.toUpperCase()} to ${delivery.recipient}`);
    console.log(`Subject: ${notification.title}`);
    console.log(`Message: ${notification.message}`);
    console.log(`Severity: ${notification.severity}`);

    // In a real application, you would:
    // - For email: Use SendGrid, AWS SES, or similar service
    // - For SMS: Use Twilio, AWS SNS, or similar service
    // - For push: Use Firebase Cloud Messaging or similar

    // Mark as sent
    await caregiverNotificationRepository.updateDelivery(delivery.id, {
      status: 'sent',
      sentAt: new Date()
    });

    // Mark notification as sent
    await caregiverNotificationRepository.updateNotification(notification.id, {
      isSent: true,
      sentAt: new Date()
    });
  }

  /**
   * Get notifications for a caregiver
   */
  async getNotificationsForCaregiver(
    caregiverId: string,
    limit = 50
  ): Promise<CaregiverNotification[]> {
    return await caregiverNotificationRepository.getNotificationsByCaregiver(caregiverId, limit);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await caregiverNotificationRepository.updateNotification(notificationId, {
      isRead: true
    });
  }

  /**
   * Get unread notification count for caregiver
   */
  async getUnreadCount(caregiverId: string): Promise<number> {
    return await caregiverNotificationRepository.getUnreadCount(caregiverId);
  }

  /**
   * Monitor for missed doses and send alerts
   * This should be called periodically (e.g., every 15 minutes)
   */
  async checkForMissedDoses(patientId: string): Promise<void> {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Get recent intake records
    const recentIntakes = await db.intakeRecords
      .where('userId')
      .equals(patientId)
      .and((record: any) => {
        const scheduledTime = new Date(record.scheduledTime);
        return scheduledTime >= fifteenMinutesAgo && scheduledTime <= now;
      })
      .toArray();

    // Check for missed doses
    for (const intake of recentIntakes) {
      if (intake.status === 'missed') {
        const medication = await db.medications.get(intake.medicationId);
        if (medication) {
          await this.sendMissedDoseAlert(
            patientId,
            medication.name,
            medication.id,
            new Date(intake.scheduledTime)
          );
        }
      }
    }
  }
}

export const caregiverNotificationService = new CaregiverNotificationService();
