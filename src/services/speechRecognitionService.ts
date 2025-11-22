export interface SpeechRecognitionSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  grammars?: SpeechGrammarList | undefined;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export interface SpeechRecognitionCapabilities {
  supported: boolean;
  languages: string[];
  continuous: boolean;
  interimResults: boolean;
}

export interface VoiceActivityDetection {
  enabled: boolean;
  silenceThreshold: number; // milliseconds
  volumeThreshold: number; // 0-100
}

export class SpeechRecognitionService {
  private static instance: SpeechRecognitionService;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private settings: SpeechRecognitionSettings = {
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 3
  };
  private vadSettings: VoiceActivityDetection = {
    enabled: true,
    silenceThreshold: 3000, // 3 seconds
    volumeThreshold: 10
  };
  private silenceTimer: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  // Event handlers
  private onResultCallback: ((result: SpeechRecognitionResult) => void) | undefined;
  private onErrorCallback: ((error: string) => void) | undefined;
  private onStartCallback: (() => void) | undefined;
  private onEndCallback: (() => void) | undefined;
  private onVoiceActivityCallback: ((isActive: boolean) => void) | undefined;

  private constructor() {
    this.initialize();
  }

  static getInstance(): SpeechRecognitionService {
    if (!SpeechRecognitionService.instance) {
      SpeechRecognitionService.instance = new SpeechRecognitionService();
    }
    return SpeechRecognitionService.instance;
  }

  /**
   * Initialize the speech recognition service
   */
  private initialize(): void {
    // Check for browser support
    const SpeechRecognition = 
      window.SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  /**
   * Setup speech recognition with event handlers
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    // Apply settings
    this.recognition.lang = this.settings.language;
    this.recognition.continuous = this.settings.continuous;
    this.recognition.interimResults = this.settings.interimResults;
    this.recognition.maxAlternatives = this.settings.maxAlternatives;

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStartCallback?.();
      this.startVoiceActivityDetection();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEndCallback?.();
      this.stopVoiceActivityDetection();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const lastResult = results[results.length - 1];
      
      if (lastResult) {
        const alternatives = Array.from(lastResult).map(alternative => ({
          transcript: alternative.transcript,
          confidence: alternative.confidence
        }));

        const firstAlternative = lastResult[0];
        if (firstAlternative) {
          const result: SpeechRecognitionResult = {
            transcript: firstAlternative.transcript,
            confidence: firstAlternative.confidence,
            isFinal: lastResult.isFinal,
            alternatives
          };

          this.onResultCallback?.(result);

          // Reset silence timer on speech
          this.resetSilenceTimer();
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = this.getErrorMessage(event.error);
      this.onErrorCallback?.(errorMessage);
    };

    this.recognition.onnomatch = () => {
      this.onErrorCallback?.('No speech was recognized');
    };
  }

  /**
   * Get speech recognition capabilities
   */
  getCapabilities(): SpeechRecognitionCapabilities {
    return {
      supported: this.recognition !== null,
      languages: this.getSupportedLanguages(),
      continuous: true,
      interimResults: true
    };
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Start listening for speech
   */
  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start speech recognition';
      throw new Error(errorMessage);
    }
  }

  /**
   * Stop listening for speech
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Abort speech recognition
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Update speech recognition settings
   */
  updateSettings(newSettings: Partial<SpeechRecognitionSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.recognition) {
      this.recognition.lang = this.settings.language;
      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.maxAlternatives = this.settings.maxAlternatives;
    }
  }

  /**
   * Update voice activity detection settings
   */
  updateVADSettings(newSettings: Partial<VoiceActivityDetection>): void {
    this.vadSettings = { ...this.vadSettings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): SpeechRecognitionSettings {
    return { ...this.settings };
  }

  /**
   * Get VAD settings
   */
  getVADSettings(): VoiceActivityDetection {
    return { ...this.vadSettings };
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: {
    onResult?: (result: SpeechRecognitionResult) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onVoiceActivity?: (isActive: boolean) => void;
  }): void {
    this.onResultCallback = handlers.onResult;
    this.onErrorCallback = handlers.onError;
    this.onStartCallback = handlers.onStart;
    this.onEndCallback = handlers.onEnd;
    this.onVoiceActivityCallback = handlers.onVoiceActivity;
  }

  /**
   * Start voice activity detection
   */
  private async startVoiceActivityDetection(): Promise<void> {
    if (!this.vadSettings.enabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.microphone.connect(this.analyser);
      
      this.monitorVoiceActivity();
      this.startSilenceTimer();
    } catch (error) {
      console.warn('Failed to start voice activity detection:', error);
    }
  }

  /**
   * Stop voice activity detection
   */
  private stopVoiceActivityDetection(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
  }

  /**
   * Monitor voice activity levels
   */
  private monitorVoiceActivity(): void {
    if (!this.analyser || !this.dataArray) return;

    const checkActivity = () => {
      if (!this.analyser || !this.dataArray || !this.isListening) return;

      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate average volume
      const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
      const volume = (average / 255) * 100;
      
      const isActive = volume > this.vadSettings.volumeThreshold;
      this.onVoiceActivityCallback?.(isActive);

      if (this.isListening) {
        requestAnimationFrame(checkActivity);
      }
    };

    checkActivity();
  }

  /**
   * Start silence timer for auto-stop
   */
  private startSilenceTimer(): void {
    if (!this.vadSettings.enabled) return;

    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        this.stopListening();
      }
    }, this.vadSettings.silenceThreshold);
  }

  /**
   * Reset silence timer
   */
  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.startSilenceTimer();
    }
  }

  /**
   * Get supported languages (approximation)
   */
  private getSupportedLanguages(): string[] {
    // Common languages supported by most browsers
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'es-ES', 'es-MX', 'es-AR', 'es-CO',
      'fr-FR', 'fr-CA',
      'de-DE',
      'it-IT',
      'pt-BR', 'pt-PT',
      'ru-RU',
      'ja-JP',
      'ko-KR',
      'zh-CN', 'zh-TW',
      'ar-SA',
      'hi-IN',
      'nl-NL',
      'sv-SE',
      'da-DK',
      'no-NO',
      'fi-FI'
    ];
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'No speech was detected. Please try speaking again.';
      case 'aborted':
        return 'Speech recognition was cancelled.';
      case 'audio-capture':
        return 'Audio capture failed. Please check your microphone.';
      case 'network':
        return 'Network error occurred during speech recognition.';
      case 'not-allowed':
        return 'Microphone access was denied. Please allow microphone access.';
      case 'service-not-allowed':
        return 'Speech recognition service is not allowed.';
      case 'bad-grammar':
        return 'Speech recognition grammar error.';
      case 'language-not-supported':
        return 'The selected language is not supported.';
      default:
        return `Speech recognition error: ${error}`;
    }
  }
}

export const speechRecognitionService = SpeechRecognitionService.getInstance();