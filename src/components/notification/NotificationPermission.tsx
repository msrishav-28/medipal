import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { useNotifications } from '@/hooks';

interface NotificationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  className?: string;
}

export function NotificationPermission({
  onPermissionGranted,
  onPermissionDenied,
  className = ''
}: NotificationPermissionProps) {
  const { permissionState, requestPermission, testNotification } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermission();
      if (result.granted) {
        onPermissionGranted?.();
      } else if (result.denied) {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await testNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      setIsTesting(false);
    }
  };

  if (permissionState.granted) {
    return (
      <Card className={`p-6 bg-success-50 border-success-200 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-h3 text-success-800 mb-2">Notifications Enabled</h3>
            <p className="text-body text-success-700 mb-4">
              You'll receive timely reminders for your medications.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestNotification}
              disabled={isTesting}
              className="bg-white text-success-700 border-success-300 hover:bg-success-50"
            >
              {isTesting ? 'Sending...' : 'Test Notification'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (permissionState.denied) {
    return (
      <Card className={`p-6 bg-warning-50 border-warning-200 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-h3 text-warning-800 mb-2">Notifications Blocked</h3>
            <p className="text-body text-warning-700 mb-4">
              To receive medication reminders, please enable notifications in your browser settings.
            </p>
            <div className="space-y-2 text-sm text-warning-600">
              <p>• Click the lock icon in your address bar</p>
              <p>• Select "Allow" for notifications</p>
              <p>• Refresh the page</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 bg-primary-50 border-primary-200 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718c.317.447.751.718 1.132.718.38 0 .815-.271 1.132-.718C8.69 17.954 12 14.689 12 8a8 8 0 1 0-16 0c0 6.689 3.31 9.954 4.868 11.718z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-h3 text-primary-800 mb-2">Enable Medication Reminders</h3>
          <p className="text-body text-primary-700 mb-4">
            Get timely notifications to help you stay on track with your medication schedule.
          </p>
          <Button
            variant="primary"
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </Button>
        </div>
      </div>
    </Card>
  );
}