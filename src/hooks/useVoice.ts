import { useState, useEffect, useCallback } from 'react';
import { voiceService, VoiceSettings, VoiceCapabilities } from '@/services/voiceService';
import { MedicationReminder } from '@/types';

export interface UseVoiceReturn {
  // Capabilities
  capabilities: VoiceCapabilities;
  isSupported: boolean;
  
  // Settings
  settings: VoiceSettings;
  updateSettings: (settings: Partial<VoiceSettings>) => void;
  
  // Speech control
  speak: (text: string) => Promise<void>;
  speakReminder: (reminder: MedicationReminder) => Promise<void>;
  speakConfirmation: (medicationName: string, action: 'taken' | 'snoozed' | 'skipped') => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  
  // Status
  isSpeaking: boolean;
  isPaused: boolean;
  error: string | null;
  
  // Testing
  testVoice: () => Promise<void>;
  autoSelectVoice: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [capabilities, setCapabilities] = useState<VoiceCapabilities>({
    supported: false,
    voices: [],
    languages: []
  });
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    language: 'en-US'
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize voice service and load capabilities
  useEffect(() => {
    const loadCapabilities = () => {
      const caps = voiceService.getCapabilities();
      setCapabilities(caps);
      setSettings(voiceService.getSettings());
    };

    // Load immediately
    loadCapabilities();

    // Some browsers load voices asynchronously
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadCapabilities;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Monitor speech status
  useEffect(() => {
    const checkStatus = () => {
      setIsSpeaking(voiceService.isSpeaking());
      setIsPaused(voiceService.isPaused());
    };

    const interval = setInterval(checkStatus, 100);
    return () => clearInterval(interval);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    try {
      voiceService.updateSettings(newSettings);
      setSettings(voiceService.getSettings());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update voice settings';
      setError(errorMessage);
    }
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    try {
      await voiceService.speak(text);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to speak text';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const speakReminder = useCallback(async (reminder: MedicationReminder): Promise<void> => {
    try {
      await voiceService.speakReminder(reminder);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to speak reminder';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const speakConfirmation = useCallback(async (
    medicationName: string, 
    action: 'taken' | 'snoozed' | 'skipped'
  ): Promise<void> => {
    try {
      await voiceService.speakConfirmation(medicationName, action);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to speak confirmation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      voiceService.stop();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop speech';
      setError(errorMessage);
    }
  }, []);

  const pause = useCallback(() => {
    try {
      voiceService.pause();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause speech';
      setError(errorMessage);
    }
  }, []);

  const resume = useCallback(() => {
    try {
      voiceService.resume();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume speech';
      setError(errorMessage);
    }
  }, []);

  const testVoice = useCallback(async (): Promise<void> => {
    try {
      await voiceService.testVoice();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test voice';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const autoSelectVoice = useCallback(() => {
    try {
      voiceService.autoSelectVoice();
      setSettings(voiceService.getSettings());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-select voice';
      setError(errorMessage);
    }
  }, []);

  return {
    capabilities,
    isSupported: capabilities.supported,
    settings,
    updateSettings,
    speak,
    speakReminder,
    speakConfirmation,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    error,
    testVoice,
    autoSelectVoice
  };
}