import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from '../useSpeechRecognition';

// Mock the speech recognition service
vi.mock('../../services/speechRecognitionService', () => ({
  speechRecognitionService: {
    getCapabilities: vi.fn(() => ({
      supported: true,
      languages: ['en-US', 'es-ES'],
      continuous: true,
      interimResults: true
    })),
    getSettings: vi.fn(() => ({
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3
    })),
    getVADSettings: vi.fn(() => ({
      enabled: true,
      silenceThreshold: 3000,
      volumeThreshold: 10
    })),
    updateSettings: vi.fn(),
    updateVADSettings: vi.fn(),
    startListening: vi.fn(),
    stopListening: vi.fn(),
    abort: vi.fn(),
    setEventHandlers: vi.fn()
  }
}));

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useSpeechRecognition());

      expect(result.current.isSupported).toBe(true);
      expect(result.current.isListening).toBe(false);
      expect(result.current.isVoiceActive).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.transcript).toBe('');
      expect(result.current.confidence).toBe(0);
    });

    it('should load capabilities and settings on mount', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      
      renderHook(() => useSpeechRecognition());

      expect(speechRecognitionService.getCapabilities).toHaveBeenCalled();
      expect(speechRecognitionService.getSettings).toHaveBeenCalled();
      expect(speechRecognitionService.getVADSettings).toHaveBeenCalled();
      expect(speechRecognitionService.setEventHandlers).toHaveBeenCalled();
    });
  });

  describe('Settings Management', () => {
    it('should update speech recognition settings', async () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      const newSettings = {
        language: 'es-ES',
        continuous: true
      };

      await act(async () => {
        result.current.updateSettings(newSettings);
      });

      expect(speechRecognitionService.updateSettings).toHaveBeenCalledWith(newSettings);
    });

    it('should update VAD settings', async () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      const newVADSettings = {
        enabled: false,
        silenceThreshold: 5000
      };

      await act(async () => {
        result.current.updateVADSettings(newVADSettings);
      });

      expect(speechRecognitionService.updateVADSettings).toHaveBeenCalledWith(newVADSettings);
    });

    it('should handle settings update errors', async () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      speechRecognitionService.updateSettings.mockImplementation(() => {
        throw new Error('Settings update failed');
      });

      await act(async () => {
        result.current.updateSettings({ language: 'invalid' });
      });

      expect(result.current.error).toBe('Settings update failed');
    });
  });

  describe('Speech Recognition Control', () => {
    it('should start listening', async () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      speechRecognitionService.startListening.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.startListening();
      });

      expect(speechRecognitionService.startListening).toHaveBeenCalled();
    });

    it('should stop listening', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.stopListening();
      });

      expect(speechRecognitionService.stopListening).toHaveBeenCalled();
    });

    it('should abort recognition', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.abort();
      });

      expect(speechRecognitionService.abort).toHaveBeenCalled();
    });

    it('should handle start listening errors', async () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      speechRecognitionService.startListening.mockRejectedValue(new Error('Microphone access denied'));

      await act(async () => {
        try {
          await result.current.startListening();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Microphone access denied');
    });
  });

  describe('Event Handling', () => {
    it('should handle speech recognition results', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      // Get the event handlers that were set
      const setEventHandlersCall = speechRecognitionService.setEventHandlers.mock.calls[0];
      const eventHandlers = setEventHandlersCall[0];

      // Simulate a result event
      act(() => {
        eventHandlers.onResult({
          transcript: 'test transcript',
          confidence: 0.9,
          isFinal: false,
          alternatives: [{ transcript: 'test transcript', confidence: 0.9 }]
        });
      });

      expect(result.current.transcript).toBe('test transcript');
      expect(result.current.interimTranscript).toBe('test transcript');
      expect(result.current.confidence).toBe(0.9);
    });

    it('should handle final results', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      const eventHandlers = speechRecognitionService.setEventHandlers.mock.calls[0][0];

      // First, add some interim results
      act(() => {
        eventHandlers.onResult({
          transcript: 'interim text',
          confidence: 0.7,
          isFinal: false,
          alternatives: []
        });
      });

      // Then add final result
      act(() => {
        eventHandlers.onResult({
          transcript: ' final text',
          confidence: 0.9,
          isFinal: true,
          alternatives: []
        });
      });

      expect(result.current.finalTranscript).toBe('interim text final text');
      expect(result.current.interimTranscript).toBe('');
    });

    it('should handle error events', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      const eventHandlers = speechRecognitionService.setEventHandlers.mock.calls[0][0];

      act(() => {
        eventHandlers.onError('No speech detected');
      });

      expect(result.current.error).toBe('No speech detected');
      expect(result.current.isListening).toBe(false);
    });

    it('should handle start and end events', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      const eventHandlers = speechRecognitionService.setEventHandlers.mock.calls[0][0];

      act(() => {
        eventHandlers.onStart();
      });

      expect(result.current.isListening).toBe(true);

      act(() => {
        eventHandlers.onEnd();
      });

      expect(result.current.isListening).toBe(false);
    });

    it('should handle voice activity events', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      const eventHandlers = speechRecognitionService.setEventHandlers.mock.calls[0][0];

      act(() => {
        eventHandlers.onVoiceActivity(true);
      });

      expect(result.current.isVoiceActive).toBe(true);

      act(() => {
        eventHandlers.onVoiceActivity(false);
      });

      expect(result.current.isVoiceActive).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should clear transcript', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      const eventHandlers = speechRecognitionService.setEventHandlers.mock.calls[0][0];

      // Add some transcript data
      act(() => {
        eventHandlers.onResult({
          transcript: 'test transcript',
          confidence: 0.9,
          isFinal: true,
          alternatives: []
        });
      });

      expect(result.current.transcript).toBe('test transcript');

      // Clear transcript
      act(() => {
        result.current.clearTranscript();
      });

      expect(result.current.transcript).toBe('');
      expect(result.current.finalTranscript).toBe('');
      expect(result.current.interimTranscript).toBe('');
      expect(result.current.confidence).toBe(0);
    });

    it('should reset error', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      const { result } = renderHook(() => useSpeechRecognition());

      const eventHandlers = speechRecognitionService.setEventHandlers.mock.calls[0][0];

      // Set an error
      act(() => {
        eventHandlers.onError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Reset error
      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Unsupported Browser', () => {
    it('should handle unsupported browsers', () => {
      const { speechRecognitionService } = require('../../services/speechRecognitionService');
      
      speechRecognitionService.getCapabilities.mockReturnValue({
        supported: false,
        languages: [],
        continuous: false,
        interimResults: false
      });

      const { result } = renderHook(() => useSpeechRecognition());

      expect(result.current.isSupported).toBe(false);
    });
  });
});