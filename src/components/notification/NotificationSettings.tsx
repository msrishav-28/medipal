import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { useNotifications } from '@/hooks';
import { NotificationSettings as NotificationSettingsType } from '@/types';

interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { settings, updateSettings, permissionState } = useNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettingsType>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: keyof NotificationSettingsType, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQuietHoursChange = (key: 'enabled' | 'start' | 'end', value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);

  if (!permissionState.granted) {
    return (
      <Card className={`p-6 bg-neutral-50 border-neutral-200 ${className}`}>
        <div className="text-center">
          <h3 className="text-h3 text-neutral-600 mb-2">Notification Settings</h3>
          <p className="text-body text-neutral-500">
            Enable notifications first to access settings.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-h3 mb-6">Notification Settings</h3>
      
      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h4 className="text-h4 text-neutral-700">Basic Settings</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-body font-medium text-neutral-700">
                Enable Notifications
              </label>
              <p className="text-sm text-neutral-500">
                Turn all medication reminders on or off
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-body font-medium text-neutral-700">
                Sound
              </label>
              <p className="text-sm text-neutral-500">
                Play sound with notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.sound}
                onChange={(e) => handleSettingChange('sound', e.target.checked)}
                disabled={!localSettings.enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-body font-medium text-neutral-700">
                Vibration
              </label>
              <p className="text-sm text-neutral-500">
                Vibrate device for notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.vibration}
                onChange={(e) => handleSettingChange('vibration', e.target.checked)}
                disabled={!localSettings.enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>

        {/* Reminder Sound */}
        <div className="space-y-4">
          <h4 className="text-h4 text-neutral-700">Reminder Sound</h4>
          
          <div className="space-y-2">
            {(['default', 'gentle', 'urgent'] as const).map((sound) => (
              <label key={sound} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="reminderSound"
                  value={sound}
                  checked={localSettings.reminderSound === sound}
                  onChange={(e) => handleSettingChange('reminderSound', e.target.value)}
                  disabled={!localSettings.enabled || !localSettings.sound}
                  className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-body text-neutral-700 capitalize">
                  {sound}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Snooze Settings */}
        <div className="space-y-4">
          <h4 className="text-h4 text-neutral-700">Snooze Settings</h4>
          
          <div>
            <label className="block text-body font-medium text-neutral-700 mb-2">
              Maximum Snoozes
            </label>
            <select
              value={localSettings.maxSnoozes}
              onChange={(e) => handleSettingChange('maxSnoozes', parseInt(e.target.value))}
              disabled={!localSettings.enabled}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
            >
              <option value={1}>1 time</option>
              <option value={2}>2 times</option>
              <option value={3}>3 times</option>
              <option value={5}>5 times</option>
            </select>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h4 className="text-h4 text-neutral-700">Quiet Hours</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-body font-medium text-neutral-700">
                Enable Quiet Hours
              </label>
              <p className="text-sm text-neutral-500">
                Silence notifications during specified hours
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.quietHours.enabled}
                onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                disabled={!localSettings.enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          {localSettings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body font-medium text-neutral-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={localSettings.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  disabled={!localSettings.enabled}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-body font-medium text-neutral-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={localSettings.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  disabled={!localSettings.enabled}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-4 border-t border-neutral-200">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}