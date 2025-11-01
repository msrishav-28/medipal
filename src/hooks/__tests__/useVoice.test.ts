import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoice } from '../useVoice';

// Mock the voice service
const mockVoiceService = {
  getCapabilities: vi.fn().mockReturnValue({
    supported: true,
    voices: [
      { name: 'English Voice', lang: 'en-US', localService: true, voiceURI: 'english' },
      { name: 'Spanish Voice', lang: 'es-ES', localService: false, voiceURI: 'spanish' }
    ],
    languages: ['en-US', 'es-ES']
  }),
  getSettings: vi.fn().mockReturnValue({
    enabled: true,
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    language: 'en-US'
  }),
  updateSettings: vi.fn(),
  speak: vi.fn(),
  speakReminder: vi.fn(),
  speakConfirmation: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  isSpeaking: vi.fn().mockReturnValue(false),
  isPaused: vi.fn().mockReturnValue(false),
  testVoice: vi.fn(),
  autoSelectVoice: vi.fn()
};

vi.mock('@/services/voiceService', () => ({
  voiceService: mockVoiceService
}));

// Mock speechSynthesis for onvoiceschanged
Object.defineProperty(globalThis, 'speechSynthesis', {
  value: {
    onvoiceschanged: null
  },
  writable: true
});

describe('useVoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with voice capabilities and settings', () => {
      const { result } = renderHook(() => useVoice());

      expect(result.current.capabilities.supported).toBe(true);
      expect(result.current.capabilities.voices).toHaveLength(2);
      expect(result.current.isSupported).toBe(true);
      expect(result.current.settings.enabled).toBe(true);
    });

    it('should handle voices loading asynchronously', () => {
      const { result } = renderHook(() => useVoice());

      // Simulate voices loaded event
      act(() => {
        if (window.speechSynthesis.onvoiceschanged) {
          window.speechSynthesis.onvoiceschanged(new Event('voiceschanged'));
        }
      });

      expect(mockVoiceService.getCapabilities).toHaveBeenCalledTimes(2); // Initial + after voices loaded
    });

    it('should monitor speech status', () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useVoice());

      // Initially not speaking
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isPaused).toBe(false);

      // Simulate speaking state change
      mockVoiceService.isSpeaking.mockReturnValue(true);
      mockVoiceService.isPaused.mockReturnValue(false);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isSpeaking).toBe(true);
      expect(result.current.isPaused).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('settings management', () => {
    it('should update voice settings', async () => {
      const { result } = renderHook(() => useVoice());
      const newSettings = { enabled: false, rate: 1.5 };

      mockVoiceService.updateSettings.mockImplementation(() => {
        mockVoiceService.getSettings.mockReturnValue({
          enabled: false,
          voice: 'default',
          rate: 1.5,
          pitch: 1.0,
          volume: 0.8,
          language: 'en-US'
        });
      });

      await act(async () => {
        result.current.updateSettings(newSettings);
      });

      expect(mockVoiceService.updateSettings).toHaveBeenCalledWith(newSettings);
      expect(result.current.settings.enabled).toBe(false);
      expect(result.current.settings.rate).toBe(1.5);
    });

    it('should handle settings update error', async () => {
      const { result } = renderHook(() => useVoice());
      
      mockVoiceService.updateSettings.mockImplementation(() => {
        throw new Error('Settings update failed');
      });

      await act(async () => {
        result.current.updateSettings({ enabled: false });
      });

      expect(result.current.error).toBe('Settings update failed');
    });
  });

  describe('speech functionality', () => {
    it('should speak text', async () => {
      const { result } = renderHook(() => useVoice());
      
      mockVoiceService.speak.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.speak('Hello world');
      });

      expect(mockVoiceService.speak).toHaveBeenCalledWith('Hello world');
      expect(result.current.error).toBe(null);
    });

    it('should handle speak error', async () => {
      const { result } = renderHook(() => useVoice());
      
      mockVoiceService.speak.mockRejectedValue(new Error('Speech failed'));

      await act(async () => {
        await expect(result.current.speak('Hello world')).rejects.toThrow('Speech failed');
      });

      expect(result.current.error).toBe('Speech failed');
    });

    it('should speak medication reminder', async () => {
      const { result } = renderHook(() => useVoice());
      const mockReminder = {
        id: 'reminder-1',
        medicationId: 'med-1',
        userId: 'user-1',
        scheduledTime: new Date(),
        medicationName: 'Metformin',
        dosage: '500mg',
        snoozeCount: 0,
        maxSnoozes: 3,
        isActive: true,
        createdAt: new Date()
      };
      
      mockVoiceService.speakReminder.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.speakReminder(mockReminder);
      });

      expect(mockVoiceService.speakReminder).toHaveBeenCalledWith(mockReminder);
    });

    it('should speak confirmation message', async () => {
      const { result } = renderHook(() => useVoice());
      
      mockVoiceService.speakConfirmation.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.speakConfirmation('Metformin', 'taken');
      });

      expect(mockVoiceService.speakConfirmation).toHaveBeenCalledWith('Metformin', 'taken');
    });
  });

  describe('speech control', () => {
    it('should stop speech', () => {
      const { result } = renderHook(() => useVoice());

      act(() => {
        result.current.stop();
      });

      expect(mockVoiceService.stop).toHaveBeenCalled();
      expect(result.current.error).toBe(null);
    });

    it('should pause speech', () => {
      const { result } = renderHook(() => useVoice());

      act(() => {
        result.current.pause();
      });

      expect(mockVoiceService.pause).toHaveBeenCalled();
    });

    it('should resume speech', () => {
      const { result } = renderHook(() => useVoice());

      act(() => {
        result.current.resume();
      });

      expect(mockVoiceService.resume).toHaveBeenCalled();
    });

    it('should handle control errors', () => {
      const { result } = renderHook(() => useVoice());
      
      mockVoiceService.stop.mockImplementation(() => {
        throw new Error('Stop failed');
      });

      act(() => {
        result.current.stop();
      });

      expect(result.current.error).toBe('Stop failed');
    });
  });

  describe('test functionality', () => {
    it('should test voice', async () => {
      const { result } = renderHook(() => useVoice());
      
      mockVoiceService.testVoice.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.testVoice();
      });

      expect(mockVoiceService.testVoice).toHaveBeenCalled();
      expect(result.current.error).toBe(null);
    });

    it('should handle test voice error', async () => {
      const { result } = renderHook(() => useVoice());
      
      mockVoiceService.testVoice.mockRejectedValue(new Error('Test failed'));

      await act(async () => {
        await expect(result.current.testVoice()).rejects.toThrow('Test failed');
      });

      expect(result.current.error).toBe('Test failed');
    });

    it('should auto-select voice', () => {
      const { result } = renderHook(() => useVoice());
      
      mockVoiceService.autoSelectVoice.mockImplementation(() => {
        mockVoiceService.getSettings.mockReturnValue({
          enabled: true,
          voice: 'English Voice',
          rate: 1.0,
          pitch: 1.0,
          volume: 0.8,
          language: 'en-US'
        });
      });

      act(() => {
        result.current.autoSelectVoice();
      });

      expect(mockVoiceService.autoSelectVoice).toHaveBeenCalled();
      expect(result.current.settings.voice).toBe('English Voice');
    });
  });

  describe('error handling', () => {
    it('should clear error on successful operation', async () => {
      const { result } = renderHook(() => useVoice());
      
      // First, cause an error
      mockVoiceService.speak.mockRejectedValue(new Error('First error'));
      
      await act(async () => {
        try {
          await result.current.speak('test');
        } catch (e) {
          // Expected to fail
        }
      });

      expect(result.current.error).toBe('First error');

      // Then, successful operation should clear error
      mockVoiceService.speak.mockResolvedValue(undefined);
      
      await act(async () => {
        await result.current.speak('test');
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('cleanup', () => {
    it('should clean up voice change listener on unmount', () => {
      const { unmount } = renderHook(() => useVoice());

      // Set up the listener
      const mockListener = vi.fn();
      window.speechSynthesis.onvoiceschanged = mockListener;

      unmount();

      expect(window.speechSynthesis.onvoiceschanged).toBe(null);
    });
  });
});