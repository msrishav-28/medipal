import { describe, it, expect, beforeEach, vi } from 'vitest';
import { speechRecognitionService } from '../speechRecognitionService';

// Mock the Web Speech API
const mockSpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  lang: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 3,
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
  onnomatch: null
};

const mockMediaDevices = {
  getUserMedia: vi.fn()
};

const mockAudioContext = {
  createAnalyser: vi.fn(),
  createMediaStreamSource: vi.fn(),
  close: vi.fn()
};

const mockAnalyser = {
  fftSize: 256,
  frequencyBinCount: 128,
  getByteFrequencyData: vi.fn(),
  connect: vi.fn()
};

const mockMediaStreamSource = {
  connect: vi.fn(),
  disconnect: vi.fn()
};

// Setup global mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock SpeechRecognition
  (globalThis as any).SpeechRecognition = vi.fn(() => mockSpeechRecognition);
  (globalThis as any).webkitSpeechRecognition = vi.fn(() => mockSpeechRecognition);
  
  // Mock MediaDevices
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true
  });
  
  // Mock AudioContext
  (globalThis as any).AudioContext = vi.fn(() => mockAudioContext);
  (globalThis as any).webkitAudioContext = vi.fn(() => mockAudioContext);
  
  // Setup mock returns
  mockAudioContext.createAnalyser.mockReturnValue(mockAnalyser);
  mockAudioContext.createMediaStreamSource.mockReturnValue(mockMediaStreamSource);
  mockMediaDevices.getUserMedia.mockResolvedValue(new MediaStream());
});

describe('SpeechRecognitionService', () => {
  describe('Capabilities', () => {
    it('should detect speech recognition support', () => {
      const capabilities = speechRecognitionService.getCapabilities();
      expect(capabilities.supported).toBe(true);
      expect(capabilities.languages).toBeInstanceOf(Array);
      expect(capabilities.languages.length).toBeGreaterThan(0);
    });

    it('should return false for unsupported browsers', () => {
      // Temporarily remove SpeechRecognition
      const originalSR = (globalThis as any).SpeechRecognition;
      const originalWebkitSR = (globalThis as any).webkitSpeechRecognition;
      
      delete (globalThis as any).SpeechRecognition;
      delete (globalThis as any).webkitSpeechRecognition;
      
      // Create new instance to test unsupported scenario
      const service = speechRecognitionService;
      expect(service.isSupported()).toBe(false);
      
      // Restore
      (globalThis as any).SpeechRecognition = originalSR;
      (globalThis as any).webkitSpeechRecognition = originalWebkitSR;
    });
  });

  describe('Settings Management', () => {
    it('should update speech recognition settings', () => {
      const newSettings = {
        language: 'es-ES',
        continuous: true,
        interimResults: false,
        maxAlternatives: 5
      };

      speechRecognitionService.updateSettings(newSettings);
      const settings = speechRecognitionService.getSettings();

      expect(settings.language).toBe('es-ES');
      expect(settings.continuous).toBe(true);
      expect(settings.interimResults).toBe(false);
      expect(settings.maxAlternatives).toBe(5);
    });

    it('should update VAD settings', () => {
      const vadSettings = {
        enabled: false,
        silenceThreshold: 5000,
        volumeThreshold: 20
      };

      speechRecognitionService.updateVADSettings(vadSettings);
      const settings = speechRecognitionService.getVADSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.silenceThreshold).toBe(5000);
      expect(settings.volumeThreshold).toBe(20);
    });
  });

  describe('Speech Recognition Control', () => {
    it('should start listening', async () => {
      await speechRecognitionService.startListening();
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should stop listening', () => {
      speechRecognitionService.stopListening();
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('should abort recognition', () => {
      speechRecognitionService.abort();
      expect(mockSpeechRecognition.abort).toHaveBeenCalled();
    });

    it('should handle start errors', async () => {
      mockSpeechRecognition.start.mockImplementation(() => {
        throw new Error('Recognition failed');
      });

      await expect(speechRecognitionService.startListening()).rejects.toThrow('Recognition failed');
    });
  });

  describe('Event Handling', () => {
    it('should set event handlers', () => {
      const handlers = {
        onResult: vi.fn(),
        onError: vi.fn(),
        onStart: vi.fn(),
        onEnd: vi.fn(),
        onVoiceActivity: vi.fn()
      };

      speechRecognitionService.setEventHandlers(handlers);

      // Simulate events
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
      expect(handlers.onStart).toHaveBeenCalled();
    });

    it('should handle recognition results', () => {
      const onResult = vi.fn();
      speechRecognitionService.setEventHandlers({ onResult });

      // Simulate recognition result
      const mockEvent = {
        results: [
          [
            {
              transcript: 'test transcript',
              confidence: 0.9
            }
          ]
        ]
      };

      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent as any);
      }

      expect(onResult).toHaveBeenCalledWith({
        transcript: 'test transcript',
        confidence: 0.9,
        isFinal: false,
        alternatives: [{ transcript: 'test transcript', confidence: 0.9 }]
      });
    });

    it('should handle recognition errors', () => {
      const onError = vi.fn();
      speechRecognitionService.setEventHandlers({ onError });

      // Simulate error
      const mockError = { error: 'no-speech' };
      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror(mockError as any);
      }

      expect(onError).toHaveBeenCalledWith('No speech was detected. Please try speaking again.');
    });
  });

  describe('Voice Activity Detection', () => {
    it('should start VAD when listening starts', async () => {
      await speechRecognitionService.startListening();
      
      // Simulate onstart event
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
    });

    it('should handle VAD initialization errors gracefully', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Microphone access denied'));
      
      await speechRecognitionService.startListening();
      
      // Should not throw error, just log warning
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });
  });

  describe('Error Messages', () => {
    const errorCases = [
      { error: 'no-speech', expected: 'No speech was detected. Please try speaking again.' },
      { error: 'aborted', expected: 'Speech recognition was cancelled.' },
      { error: 'audio-capture', expected: 'Audio capture failed. Please check your microphone.' },
      { error: 'network', expected: 'Network error occurred during speech recognition.' },
      { error: 'not-allowed', expected: 'Microphone access was denied. Please allow microphone access.' },
      { error: 'unknown-error', expected: 'Speech recognition error: unknown-error' }
    ];

    errorCases.forEach(({ error, expected }) => {
      it(`should return correct error message for ${error}`, () => {
        const onError = vi.fn();
        speechRecognitionService.setEventHandlers({ onError });

        if (mockSpeechRecognition.onerror) {
          mockSpeechRecognition.onerror({ error } as any);
        }

        expect(onError).toHaveBeenCalledWith(expected);
      });
    });
  });
});