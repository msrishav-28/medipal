import { useEffect, useState } from 'react';
import { caregiverNotificationService } from '../../services/caregiverNotificationService';
import { CaregiverNotification } from '../../types/notification';
import { Card } from '../ui/Card';
import Badge from '../ui/Badge';
import { Button } from '../ui/Button';

interface CaregiverNotificationsProps {
  caregiverId: string;
}

export function CaregiverNotifications({ caregiverId }: CaregiverNotificationsProps) {
  const [notifications, setNotifications] = useState<CaregiverNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [caregiverId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await caregiverNotificationService.getNotificationsForCaregiver(caregiverId);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await caregiverNotificationService.getUnreadCount(caregiverId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await caregiverNotificationService.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getSeverityVariant = (severity: CaregiverNotification['severity']): 'info' | 'warning' | 'error' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getTypeLabel = (type: CaregiverNotification['type']): string => {
    switch (type) {
      case 'missed-dose':
        return 'Missed Dose';
      case 'critical-medication':
        return 'Critical Alert';
      case 'weekly-report':
        return 'Weekly Report';
      case 'emergency':
        return 'Emergency';
      default:
        return type;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'secondary'}
            size="sm"
          >
            All
          </Button>
          <Button
            onClick={() => setFilter('unread')}
            variant={filter === 'unread' ? 'default' : 'secondary'}
            size="sm"
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray-600">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${!notification.isRead ? 'border-l-4 border-blue-500 bg-blue-50' : ''}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getSeverityVariant(notification.severity)}>
                        {getTypeLabel(notification.type)}
                      </Badge>
                      {!notification.isRead && (
                        <Badge variant="primary" size="sm">
                          New
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    {notification.medicationName && (
                      <p className="text-sm text-gray-600 mb-1">
                        Medication: {notification.medicationName}
                      </p>
                    )}
                    {notification.scheduledTime && (
                      <p className="text-sm text-gray-600 mb-1">
                        Scheduled: {new Date(notification.scheduledTime).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!notification.isRead && (
                      <Button
                        onClick={() => handleMarkAsRead(notification.id)}
                        variant="secondary"
                        size="sm"
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
