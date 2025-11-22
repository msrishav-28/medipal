import { MedicationReminder } from '@/types';

export interface VoiceSettings {
  enabled: boolean;
  voice: string; // Voice name or 'default'
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  language: string; // Language code like 'en-US'
}

export interface VoiceCapabilities {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  languages: string[];
}

export class VoiceService {
  private static instance: VoiceService;
  private synthesis: SpeechSynthesis | null = null;
  private settings: VoiceSettings = {
    enabled: true,
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    language: 'en-US'
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  /**
   * Initialize the voice service
   */
  private initialize(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadSettings();
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }

  /**
   * Get voice capabilities
   */
  getCapabilities(): VoiceCapabilities {
    if (!this.synthesis) {
      return {
        supported: false,
        voices: [],
        languages: []
      };
    }

    const voices = this.synthesis.getVoices();
    const languages = [...new Set(voices.map(voice => voice.lang))];

    return {
      supported: true,
      voices,
      languages
    };
  }

  /**
   * Check if voice synthesis is supported
   */
  isSupported(): boolean {
    return this.synthesis !== null;
  }

  /**
   * Speak medication reminder
   */
  async speakReminder(reminder: MedicationReminder): Promise<void> {
    if (!this.settings.enabled || !this.synthesis) {
      return;
    }

    const message = this.createReminderMessage(reminder);
    await this.speak(message);
  }

  /**
   * Speak custom text
   */
  async speak(text: string): Promise<void> {
    if (!this.synthesis || !this.settings.enabled) {
      throw new Error('Voice synthesis not available or disabled');
    }

    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Voice synthesis not available'));
        return;
      }
      
      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply settings
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;
      utterance.lang = this.settings.language;

      // Set voice if specified
      if (this.settings.voice !== 'default' && this.synthesis) {
        const voices = this.synthesis.getVoices();
        const selectedVoice = voices.find(voice => 
          voice.name === this.settings.voice || voice.voiceURI === this.settings.voice
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      // Event handlers
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      // Speak the text
      if (this.synthesis) {
        this.synthesis.speak(utterance);
      }
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  /**
   * Check if speech is paused
   */
  isPaused(): boolean {
    return this.synthesis ? this.synthesis.paused : false;
  }

  /**
   * Create a natural reminder message
   */
  private createReminderMessage(reminder: MedicationReminder): string {
    let message = `It's time to take your medication. `;
    message += `${reminder.medicationName}, ${reminder.dosage}. `;
    
    if (reminder.instructions) {
      message += `Remember: ${reminder.instructions}. `;
    }

    if (reminder.snoozeCount > 0) {
      message += `This reminder has been snoozed ${reminder.snoozeCount} time${reminder.snoozeCount > 1 ? 's' : ''}. `;
    }

    message += `Please take your medication now.`;

    return message;
  }

  /**
   * Create confirmation message
   */
  createConfirmationMessage(medicationName: string, action: 'taken' | 'snoozed' | 'skipped'): string {
    switch (action) {
      case 'taken':
        return `Great! ${medicationName} has been marked as taken.`;
      case 'snoozed':
        return `${medicationName} has been snoozed. You'll be reminded again shortly.`;
      case 'skipped':
        return `${medicationName} has been marked as skipped.`;
      default:
        return 'Action completed.';
    }
  }

  /**
   * Speak confirmation message
   */
  async speakConfirmation(medicationName: string, action: 'taken' | 'snoozed' | 'skipped'): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    const message = this.createConfirmationMessage(medicationName, action);
    await this.speak(message);
  }

  /**
   * Test voice with sample text
   */
  async testVoice(): Promise<void> {
    const testMessage = "This is a test of the voice announcement system. Your medication reminders will sound like this.";
    await this.speak(testMessage);
  }

  /**
   * Update voice settings
   */
  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  /**
   * Get current voice settings
   */
  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('voice-settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load voice settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('voice-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  }

  /**
   * Get recommended voices for medication reminders
   */
  getRecommendedVoices(): SpeechSynthesisVoice[] {
    const capabilities = this.getCapabilities();
    if (!capabilities.supported) {
      return [];
    }

    // Prefer local voices and specific characteristics for medication reminders
    return capabilities.voices
      .filter(voice => {
        // Prefer local voices (usually more reliable)
        if (voice.localService) return true;
        
        // Prefer voices that match user's language
        const languagePrefix = this.settings.language.split('-')[0];
        if (languagePrefix && voice.lang.startsWith(languagePrefix)) return true;
        
        return false;
      })
      .sort((a, b) => {
        // Sort by preference: local first, then by language match
        if (a.localService && !b.localService) return -1;
        if (!a.localService && b.localService) return 1;
        
        const aLangMatch = a.lang === this.settings.language;
        const bLangMatch = b.lang === this.settings.language;
        
        if (aLangMatch && !bLangMatch) return -1;
        if (!aLangMatch && bLangMatch) return 1;
        
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Auto-select best voice for medication reminders
   */
  autoSelectVoice(): void {
    const recommended = this.getRecommendedVoices();
    if (recommended.length > 0 && recommended[0]) {
      this.updateSettings({ voice: recommended[0].name });
    }
  }
}

export const voiceService = VoiceService.getInstance();