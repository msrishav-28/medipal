import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  speechRecognitionService, 
  SpeechRecognitionSettings, 
  SpeechRecognitionResult, 
  SpeechRecognitionCapabilities,
  VoiceActivityDetection 
} from '@/services/speechRecognitionService';

export interface UseSpeechRecognitionReturn {
  // Capabilities
  capabilities: SpeechRecognitionCapabilities;
  isSupported: boolean;
  
  // Settings
  settings: SpeechRecognitionSettings;
  vadSettings: VoiceActivityDetection;
  updateSettings: (settings: Partial<SpeechRecognitionSettings>) => void;
  updateVADSettings: (settings: Partial<VoiceActivityDetection>) => void;
  
  // Recognition control
  startListening: () => Promise<void>;
  stopListening: () => void;
  abort: () => void;
  
  // Status
  isListening: boolean;
  isVoiceActive: boolean;
  error: string | null;
  
  // Results
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  confidence: number;
  alternatives: Array<{ transcript: string; confidence: number }>;
  
  // Utilities
  clearTranscript: () => void;
  resetError: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [capabilities, setCapabilities] = useState<SpeechRecognitionCapabilities>({
    supported: false,
    languages: [],
    continuous: false,
    interimResults: false
  });
  const [settings, setSettings] = useState<SpeechRecognitionSettings>({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 3
  });
  const [vadSettings, setVADSettings] = useState<VoiceActivityDetection>({
    enabled: true,
    silenceThreshold: 3000,
    volumeThreshold: 10
  });
  const [isListening, setIsListening] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [alternatives, setAlternatives] = useState<Array<{ transcript: string; confidence: number }>>([]);

  // Use refs to avoid stale closures in event handlers
  const isListeningRef = useRef(isListening);
  const finalTranscriptRef = useRef(finalTranscript);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    finalTranscriptRef.current = finalTranscript;
  }, [finalTranscript]);

  // Initialize speech recognition service
  useEffect(() => {
    const caps = speechRecognitionService.getCapabilities();
    setCapabilities(caps);
    setSettings(speechRecognitionService.getSettings());
    setVADSettings(speechRecognitionService.getVADSettings());

    // Set up event handlers
    speechRecognitionService.setEventHandlers({
      onResult: (result: SpeechRecognitionResult) => {
        setConfidence(result.confidence);
        setAlternatives(result.alternatives);
        
        if (result.isFinal) {
          const newFinalTranscript = finalTranscriptRef.current + result.transcript;
          setFinalTranscript(newFinalTranscript);
          setTranscript(newFinalTranscript);
          setInterimTranscript('');
        } else {
          setInterimTranscript(result.transcript);
          setTranscript(finalTranscriptRef.current + result.transcript);
        }
        
        setError(null);
      },
      onError: (errorMessage: string) => {
        setError(errorMessage);
        setIsListening(false);
      },
      onStart: () => {
        setIsListening(true);
        setError(null);
      },
      onEnd: () => {
        setIsListening(false);
      },
      onVoiceActivity: (isActive: boolean) => {
        setIsVoiceActive(isActive);
      }
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SpeechRecognitionSettings>) => {
    try {
      speechRecognitionService.updateSettings(newSettings);
      setSettings(speechRecognitionService.getSettings());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update speech recognition settings';
      setError(errorMessage);
    }
  }, []);

  const updateVADSettings = useCallback((newSettings: Partial<VoiceActivityDetection>) => {
    try {
      speechRecognitionService.updateVADSettings(newSettings);
      setVADSettings(speechRecognitionService.getVADSettings());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update VAD settings';
      setError(errorMessage);
    }
  }, []);

  const startListening = useCallback(async (): Promise<void> => {
    try {
      await speechRecognitionService.startListening();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start listening';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      speechRecognitionService.stopListening();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop listening';
      setError(errorMessage);
    }
  }, []);

  const abort = useCallback(() => {
    try {
      speechRecognitionService.abort();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to abort speech recognition';
      setError(errorMessage);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setAlternatives([]);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    capabilities,
    isSupported: capabilities.supported,
    settings,
    vadSettings,
    updateSettings,
    updateVADSettings,
    startListening,
    stopListening,
    abort,
    isListening,
    isVoiceActive,
    error,
    transcript,
    interimTranscript,
    finalTranscript,
    confidence,
    alternatives,
    clearTranscript,
    resetError
  };
}