import { db, DatabaseCaregiverNotification, DatabaseCaregiverNotificationDelivery } from './database';
import { CaregiverNotification, CaregiverNotificationDelivery } from '../types/notification';

/**
 * Repository for caregiver notifications with Date/number conversions
 */
class CaregiverNotificationRepository {
  /**
   * Convert database notification to domain notification
   */
  private toNotification(dbNotification: DatabaseCaregiverNotification): CaregiverNotification {
    const notification: CaregiverNotification = {
      id: dbNotification.id,
      caregiverId: dbNotification.caregiverId,
      patientId: dbNotification.patientId,
      type: dbNotification.type,
      title: dbNotification.title,
      message: dbNotification.message,
      severity: dbNotification.severity,
      isRead: dbNotification.isRead,
      isSent: dbNotification.isSent,
      createdAt: new Date(dbNotification.createdAt)
    };

    if (dbNotification.medicationId) {
      notification.medicationId = dbNotification.medicationId;
    }
    if (dbNotification.medicationName) {
      notification.medicationName = dbNotification.medicationName;
    }
    if (dbNotification.scheduledTime) {
      notification.scheduledTime = new Date(dbNotification.scheduledTime);
    }
    if (dbNotification.sentAt) {
      notification.sentAt = new Date(dbNotification.sentAt);
    }

    return notification;
  }

  /**
   * Convert domain notification to database notification
   */
  private toDatabase(notification: CaregiverNotification): DatabaseCaregiverNotification {
    const dbNotification: DatabaseCaregiverNotification = {
      id: notification.id,
      caregiverId: notification.caregiverId,
      patientId: notification.patientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      isRead: notification.isRead,
      isSent: notification.isSent,
      createdAt: notification.createdAt.getTime()
    };

    if (notification.medicationId) {
      dbNotification.medicationId = notification.medicationId;
    }
    if (notification.medicationName) {
      dbNotification.medicationName = notification.medicationName;
    }
    if (notification.scheduledTime) {
      dbNotification.scheduledTime = notification.scheduledTime.getTime();
    }
    if (notification.sentAt) {
      dbNotification.sentAt = notification.sentAt.getTime();
    }

    return dbNotification;
  }

  /**
   * Convert database delivery to domain delivery
   */
  private toDelivery(dbDelivery: DatabaseCaregiverNotificationDelivery): CaregiverNotificationDelivery {
    const delivery: CaregiverNotificationDelivery = {
      id: dbDelivery.id,
      notificationId: dbDelivery.notificationId,
      caregiverId: dbDelivery.caregiverId,
      deliveryMethod: dbDelivery.deliveryMethod,
      status: dbDelivery.status,
      recipient: dbDelivery.recipient,
      createdAt: new Date(dbDelivery.createdAt)
    };

    if (dbDelivery.sentAt) {
      delivery.sentAt = new Date(dbDelivery.sentAt);
    }
    if (dbDelivery.error) {
      delivery.error = dbDelivery.error;
    }

    return delivery;
  }

  /**
   * Convert domain delivery to database delivery
   */
  private toDeliveryDB(delivery: CaregiverNotificationDelivery): DatabaseCaregiverNotificationDelivery {
    const dbDelivery: DatabaseCaregiverNotificationDelivery = {
      id: delivery.id,
      notificationId: delivery.notificationId,
      caregiverId: delivery.caregiverId,
      deliveryMethod: delivery.deliveryMethod,
      status: delivery.status,
      recipient: delivery.recipient,
      createdAt: delivery.createdAt.getTime()
    };

    if (delivery.sentAt) {
      dbDelivery.sentAt = delivery.sentAt.getTime();
    }
    if (delivery.error) {
      dbDelivery.error = delivery.error;
    }

    return dbDelivery;
  }

  /**
   * Add a new notification
   */
  async addNotification(notification: CaregiverNotification): Promise<void> {
    await db.caregiverNotifications.add(this.toDatabase(notification));
  }

  /**
   * Get notification by ID
   */
  async getNotification(id: string): Promise<CaregiverNotification | undefined> {
    const dbNotification = await db.caregiverNotifications.get(id);
    return dbNotification ? this.toNotification(dbNotification) : undefined;
  }

  /**
   * Get notifications for a caregiver
   */
  async getNotificationsByCaregiver(caregiverId: string, limit = 50): Promise<CaregiverNotification[]> {
    const dbNotifications = await db.caregiverNotifications
      .where('caregiverId')
      .equals(caregiverId)
      .reverse()
      .limit(limit)
      .toArray();

    return dbNotifications.map((n: DatabaseCaregiverNotification) => this.toNotification(n));
  }

  /**
   * Update notification
   */
  async updateNotification(id: string, updates: Partial<CaregiverNotification>): Promise<void> {
    const dbUpdates: any = { ...updates };
    
    if (updates.scheduledTime) {
      dbUpdates.scheduledTime = updates.scheduledTime.getTime();
    }
    if (updates.sentAt) {
      dbUpdates.sentAt = updates.sentAt.getTime();
    }
    if (updates.createdAt) {
      dbUpdates.createdAt = updates.createdAt.getTime();
    }

    await db.caregiverNotifications.update(id, dbUpdates);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(caregiverId: string): Promise<number> {
    return await db.caregiverNotifications
      .where('caregiverId')
      .equals(caregiverId)
      .and((n: DatabaseCaregiverNotification) => !n.isRead)
      .count();
  }

  /**
   * Add a new delivery
   */
  async addDelivery(delivery: CaregiverNotificationDelivery): Promise<void> {
    await db.caregiverNotificationDeliveries.add(this.toDeliveryDB(delivery));
  }

  /**
   * Get pending deliveries
   */
  async getPendingDeliveries(): Promise<CaregiverNotificationDelivery[]> {
    const dbDeliveries = await db.caregiverNotificationDeliveries
      .where('status')
      .equals('pending')
      .toArray();

    return dbDeliveries.map((d: DatabaseCaregiverNotificationDelivery) => this.toDelivery(d));
  }

  /**
   * Update delivery
   */
  async updateDelivery(id: string, updates: Partial<CaregiverNotificationDelivery>): Promise<void> {
    const dbUpdates: any = { ...updates };
    
    if (updates.sentAt) {
      dbUpdates.sentAt = updates.sentAt.getTime();
    }
    if (updates.createdAt) {
      dbUpdates.createdAt = updates.createdAt.getTime();
    }

    await db.caregiverNotificationDeliveries.update(id, dbUpdates);
  }
}

export const caregiverNotificationRepository = new CaregiverNotificationRepository();
