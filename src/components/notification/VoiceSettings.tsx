import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { useVoice } from '@/hooks/useVoice';
import { VoiceSettings as VoiceSettingsType } from '@/services/voiceService';

interface VoiceSettingsProps {
  className?: string;
}

export function VoiceSettings({ className = '' }: VoiceSettingsProps) {
  const {
    capabilities,
    isSupported,
    settings,
    updateSettings,
    testVoice,
    autoSelectVoice,
    isSpeaking,
    error
  } = useVoice();

  const [localSettings, setLocalSettings] = useState<VoiceSettingsType>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSettingChange = (key: keyof VoiceSettingsType, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateSettings(localSettings);
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      // Apply current settings temporarily for testing
      updateSettings(localSettings);
      await testVoice();
    } catch (error) {
      console.error('Failed to test voice:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleAutoSelect = () => {
    autoSelectVoice();
    setLocalSettings(settings);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);

  if (!isSupported) {
    return (
      <Card className={`p-6 bg-neutral-50 border-neutral-200 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-h3 text-neutral-600 mb-2">Voice Not Supported</h3>
          <p className="text-body text-neutral-500">
            Your browser doesn't support voice announcements. Please use a modern browser for this feature.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-h3">Voice Settings</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAutoSelect}
          className="text-sm"
        >
          Auto-select Best Voice
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Enable Voice */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-body font-medium text-neutral-700">
              Voice Announcements
            </label>
            <p className="text-sm text-neutral-500">
              Speak medication reminders aloud
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

        {localSettings.enabled && (
          <>
            {/* Voice Selection */}
            <div>
              <label className="block text-body font-medium text-neutral-700 mb-2">
                Voice
              </label>
              <select
                value={localSettings.voice}
                onChange={(e) => handleSettingChange('voice', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="default">Default Voice</option>
                {capabilities.voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.name}>
                    {voice.name} ({voice.lang})
                    {voice.localService ? ' - Local' : ' - Online'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                Local voices are more reliable for offline use
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-body font-medium text-neutral-700 mb-2">
                Language
              </label>
              <select
                value={localSettings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {capabilities.languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {new Intl.DisplayNames([lang], { type: 'language' }).of(lang) || lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate */}
            <div>
              <label className="block text-body font-medium text-neutral-700 mb-2">
                Speaking Rate: {localSettings.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={localSettings.rate}
                onChange={(e) => handleSettingChange('rate', parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Slower</span>
                <span>Normal</span>
                <span>Faster</span>
              </div>
            </div>

            {/* Pitch */}
            <div>
              <label className="block text-body font-medium text-neutral-700 mb-2">
                Voice Pitch: {localSettings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={localSettings.pitch}
                onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Lower</span>
                <span>Normal</span>
                <span>Higher</span>
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="block text-body font-medium text-neutral-700 mb-2">
                Volume: {Math.round(localSettings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={localSettings.volume}
                onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Quiet</span>
                <span>Medium</span>
                <span>Loud</span>
              </div>
            </div>

            {/* Test Voice */}
            <div className="pt-4 border-t border-neutral-200">
              <Button
                variant="secondary"
                onClick={handleTest}
                disabled={isTesting || isSpeaking}
                className="w-full"
              >
                {isTesting || isSpeaking ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing Voice...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    Test Voice
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-4 border-t border-neutral-200">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save Voice Settings'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}