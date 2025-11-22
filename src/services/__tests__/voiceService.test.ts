import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceService } from '../voiceService';
import { MedicationReminder } from '@/types';

// Mock SpeechSynthesis API
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(),
  speaking: false,
  paused: false
};

const mockSpeechSynthesisUtterance = vi.fn();

Object.defineProperty(globalThis, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true
});

Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  value: mockSpeechSynthesisUtterance,
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('VoiceService', () => {
  let voiceService: VoiceService;
  let mockReminder: MedicationReminder;
  let mockUtterance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock utterance instance
    mockUtterance = {
      text: '',
      rate: 1,
      pitch: 1,
      volume: 1,
      lang: 'en-US',
      voice: null,
      onend: null,
      onerror: null
    };
    
    mockSpeechSynthesisUtterance.mockReturnValue(mockUtterance);
    
    // Mock voices
    mockSpeechSynthesis.getVoices.mockReturnValue([
      {
        name: 'English Voice',
        lang: 'en-US',
        localService: true,
        voiceURI: 'english-voice'
      },
      {
        name: 'Spanish Voice',
        lang: 'es-ES',
        localService: false,
        voiceURI: 'spanish-voice'
      }
    ]);

    voiceService = VoiceService.getInstance();

    mockReminder = {
      id: 'test-reminder-1',
      medicationId: 'test-med-1',
      userId: 'test-user-1',
      scheduledTime: new Date(),
      medicationName: 'Metformin',
      dosage: '500mg',
      instructions: 'Take with food',
      snoozeCount: 0,
      maxSnoozes: 3,
      isActive: true,
      createdAt: new Date()
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization and capabilities', () => {
    it('should detect speech synthesis support', () => {
      expect(voiceService.isSupported()).toBe(true);
    });

    it('should get voice capabilities', () => {
      const capabilities = voiceService.getCapabilities();
      
      expect(capabilities.supported).toBe(true);
      expect(capabilities.voices).toHaveLength(2);
      expect(capabilities.languages).toContain('en-US');
      expect(capabilities.languages).toContain('es-ES');
    });

    it('should handle unsupported browser', () => {
      // Temporarily remove speechSynthesis
      const originalSpeechSynthesis = globalThis.speechSynthesis;
      delete (globalThis as any).speechSynthesis;
      
      const newService = VoiceService.getInstance();
      
      expect(newService.isSupported()).toBe(false);
      expect(newService.getCapabilities().supported).toBe(false);
      
      // Restore speechSynthesis
      globalThis.speechSynthesis = originalSpeechSynthesis;
    });
  });

  describe('speech functionality', () => {
    it('should speak text successfully', async () => {
      const testText = 'Hello world';
      
      // Mock successful speech
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance.onend?.(), 100);
      });

      await voiceService.speak(testText);

      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(testText);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle speech error', async () => {
      const testText = 'Hello world';
      
      // Mock speech error
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance.onerror?.({ error: 'synthesis-failed' }), 100);
      });

      await expect(voiceService.speak(testText))
        .rejects.toThrow('Speech synthesis error: synthesis-failed');
    });

    it('should apply voice settings', async () => {
      const settings = {
        rate: 1.5,
        pitch: 0.8,
        volume: 0.7,
        language: 'en-US'
      };
      
      voiceService.updateSettings(settings);
      
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance.onend?.(), 100);
      });

      await voiceService.speak('test');

      expect(mockUtterance.rate).toBe(1.5);
      expect(mockUtterance.pitch).toBe(0.8);
      expect(mockUtterance.volume).toBe(0.7);
      expect(mockUtterance.lang).toBe('en-US');
    });

    it('should set specific voice when configured', async () => {
      voiceService.updateSettings({ voice: 'English Voice' });
      
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance.onend?.(), 100);
      });

      await voiceService.speak('test');

      expect(mockUtterance.voice).toEqual(
        expect.objectContaining({ name: 'English Voice' })
      );
    });

    it('should cancel ongoing speech before speaking', async () => {
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance.onend?.(), 100);
      });

      await voiceService.speak('test');

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('medication reminders', () => {
    beforeEach(() => {
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance.onend?.(), 100);
      });
    });

    it('should speak medication reminder', async () => {
      await voiceService.speakReminder(mockReminder);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      const spokenText = mockSpeechSynthesisUtterance.mock.calls[0][0];
      expect(spokenText).toContain('Metformin');
      expect(spokenText).toContain('500mg');
      expect(spokenText).toContain('Take with food');
    });

    it('should include snooze information in reminder', async () => {
      const snoozedReminder = {
        ...mockReminder,
        snoozeCount: 2
      };

      await voiceService.speakReminder(snoozedReminder);

      const spokenText = mockSpeechSynthesisUtterance.mock.calls[0][0];
      expect(spokenText).toContain('snoozed 2 times');
    });

    it('should not speak when voice disabled', async () => {
      voiceService.updateSettings({ enabled: false });

      await voiceService.speakReminder(mockReminder);

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });
  });

  describe('confirmation messages', () => {
    beforeEach(() => {
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance.onend?.(), 100);
      });
    });

    it('should speak taken confirmation', async () => {
      await voiceService.speakConfirmation('Metformin', 'taken');

      const spokenText = mockSpeechSynthesisUtterance.mock.calls[0][0];
      expect(spokenText).toContain('Metformin');
      expect(spokenText).toContain('marked as taken');
    });

    it('should speak snoozed confirmation', async () => {
      await voiceService.speakConfirmation('Metformin', 'snoozed');

      const spokenText = mockSpeechSynthesisUtterance.mock.calls[0][0];
      expect(spokenText).toContain('Metformin');
      expect(spokenText).toContain('snoozed');
    });

    it('should speak skipped confirmation', async () => {
      await voiceService.speakConfirmation('Metformin', 'skipped');

      const spokenText = mockSpeechSynthesisUtterance.mock.calls[0][0];
      expect(spokenText).toContain('Metformin');
      expect(spokenText).toContain('skipped');
    });
  });

  describe('speech control', () => {
    it('should stop speech', () => {
      voiceService.stop();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should pause speech', () => {
      voiceService.pause();
      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    });

    it('should resume speech', () => {
      voiceService.resume();
      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });

    it('should check if speaking', () => {
      mockSpeechSynthesis.speaking = true;
      expect(voiceService.isSpeaking()).toBe(true);
      
      mockSpeechSynthesis.speaking = false;
      expect(voiceService.isSpeaking()).toBe(false);
    });

    it('should check if paused', () => {
      mockSpeechSynthesis.paused = true;
      expect(voiceService.isPaused()).toBe(true);
      
      mockSpeechSynthesis.paused = false;
      expect(voiceService.isPaused()).toBe(false);
    });
  });

  describe('settings management', () => {
    it('should update voice settings', () => {
      const newSettings = {
        enabled: false,
        rate: 1.5,
        pitch: 0.8,
        volume: 0.6
      };

      voiceService.updateSettings(newSettings);
      
      const settings = voiceService.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.rate).toBe(1.5);
      expect(settings.pitch).toBe(0.8);
      expect(settings.volume).toBe(0.6);
    });

    it('should save settings to localStorage', () => {
      const newSettings = { enabled: false };
      
      voiceService.updateSettings(newSettings);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'voice-settings',
        expect.stringContaining('"enabled":false')
      );
    });

    it('should load settings from localStorage', () => {
      const storedSettings = {
        enabled: false,
        rate: 1.2,
        voice: 'English Voice'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedSettings));
      
      // Create new instance to trigger loading
      const newService = VoiceService.getInstance();
      
      const settings = newService.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.rate).toBe(1.2);
      expect(settings.voice).toBe('English Voice');
    });
  });

  describe('voice recommendations', () => {
    it('should get recommended voices', () => {
      const recommended = voiceService.getRecommendedVoices();
      
      expect(recommended).toHaveLength(2);
      // Local voice should be first
      expect(recommended[0].localService).toBe(true);
    });

    it('should auto-select best voice', () => {
      voiceService.autoSelectVoice();
      
      const settings = voiceService.getSettings();
      expect(settings.voice).toBe('English Voice'); // Should select the local voice
    });
  });

  describe('test functionality', () => {
    it('should test voice with sample message', async () => {
      mockSpeechSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance.onend?.(), 100);
      });

      await voiceService.testVoice();

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      const spokenText = mockSpeechSynthesisUtterance.mock.calls[0][0];
      expect(spokenText).toContain('test');
      expect(spokenText).toContain('voice announcement system');
    });
  });
});