import { useCallback } from 'react';
import { useCurrentUser, useUpdateUserPreferences } from './useUser';
import { UserPreferences } from '@/types';

export function useUserPreferences() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const updatePreferencesMutation = useUpdateUserPreferences();

  const preferences = currentUser?.preferences;

  const updatePreferences = useCallback(
    (newPreferences: Partial<UserPreferences>) => {
      if (!currentUser) return;

      updatePreferencesMutation.mutate({
        id: currentUser.id,
        preferences: newPreferences
      });
    },
    [currentUser, updatePreferencesMutation]
  );

  const toggleVoice = useCallback(() => {
    if (!preferences) return;
    updatePreferences({ voiceEnabled: !preferences.voiceEnabled });
  }, [preferences, updatePreferences]);

  const toggleAccessibilityMode = useCallback(() => {
    if (!preferences) return;
    updatePreferences({ accessibilityMode: !preferences.accessibilityMode });
  }, [preferences, updatePreferences]);

  const toggleHighContrast = useCallback(() => {
    if (!preferences) return;
    updatePreferences({ highContrast: !preferences.highContrast });
  }, [preferences, updatePreferences]);

  const setFontSize = useCallback((fontSize: UserPreferences['fontSize']) => {
    updatePreferences({ fontSize });
  }, [updatePreferences]);

  const setLanguage = useCallback((language: string) => {
    updatePreferences({ language });
  }, [updatePreferences]);

  const setNotificationSound = useCallback((notificationSound: string) => {
    updatePreferences({ notificationSound });
  }, [updatePreferences]);

  return {
    preferences,
    isLoading,
    isUpdating: updatePreferencesMutation.isPending,
    updatePreferences,
    toggleVoice,
    toggleAccessibilityMode,
    toggleHighContrast,
    setFontSize,
    setLanguage,
    setNotificationSound,
  };
}