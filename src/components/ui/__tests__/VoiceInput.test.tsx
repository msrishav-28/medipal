import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceInput } from '../VoiceInput';

// Mock the speech recognition hook
vi.mock('../../../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: vi.fn(() => ({
    isSupported: true,
    isListening: false,
    isVoiceActive: false,
    error: null,
    transcript: '',
    interimTranscript: '',
    finalTranscript: '',
    confidence: 0,
    startListening: vi.fn(),
    stopListening: vi.fn(),
    clearTranscript: vi.fn(),
    resetError: vi.fn(),
    updateSettings: vi.fn()
  }))
}));

describe('VoiceInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render text input and voice button', () => {
      render(<VoiceInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      const button = screen.getByRole('button');
      
      expect(textarea).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    it('should show placeholder text', () => {
      const placeholder = 'Enter your message';
      render(<VoiceInput {...defaultProps} placeholder={placeholder} />);
      
      const textarea = screen.getByPlaceholderText(placeholder);
      expect(textarea).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(<VoiceInput {...defaultProps} value="Test message" />);
      
      const textarea = screen.getByDisplayValue('Test message');
      expect(textarea).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<VoiceInput {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });
  });

  describe('Text Input', () => {
    it('should call onChange when text is typed', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      
      render(<VoiceInput {...defaultProps} value="" onChange={onChange} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      
      // onChange is called for each character typed
      expect(onChange).toHaveBeenCalled();
      // The controlled component updates value prop externally, so check all calls
      const allValues = onChange.mock.calls.map(call => call[0]);
      expect(allValues).toContain('Hello');
    });

    it('should call onSubmit when Enter is pressed', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      
      render(<VoiceInput {...defaultProps} value="Test message" onSubmit={onSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '{enter}');
      
      expect(onSubmit).toHaveBeenCalledWith('Test message');
    });

    it('should not call onSubmit when Shift+Enter is pressed', async () => {
      const onSubmit = vi.fn();
      
      render(<VoiceInput {...defaultProps} value="Test message" onSubmit={onSubmit} />);
      
      const textarea = screen.getByRole('textbox');
      // Use fireEvent.keyDown with shiftKey modifier
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should respect maxLength', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      
      render(<VoiceInput {...defaultProps} value="" onChange={onChange} maxLength={5} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '123456789');
      
      // Check that onChange was called but values don't exceed maxLength
      const allValues = onChange.mock.calls.map(call => call[0]);
      allValues.forEach(value => {
        expect(value.length).toBeLessThanOrEqual(5);
      });
    });

    it('should show character count when maxLength is set', () => {
      render(<VoiceInput {...defaultProps} value="Hello" maxLength={10} />);
      
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });
  });

  describe('Voice Input Integration', () => {
    it('should start listening when voice button is clicked', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      const mockStartListening = vi.fn();
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: false,
        isVoiceActive: false,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        startListening: mockStartListening,
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} />);
      
      const voiceButton = screen.getByRole('button');
      fireEvent.click(voiceButton);
      
      expect(mockStartListening).toHaveBeenCalled();
    });

    it('should show listening placeholder when listening', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: true,
        isVoiceActive: false,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Listening... Speak now');
      expect(textarea).toBeInTheDocument();
    });

    it('should disable text input when listening', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: true,
        isVoiceActive: false,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should show recording indicator when listening', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: true,
        isVoiceActive: true,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} />);
      
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });
  });

  describe('Speech Recognition Results', () => {
    it('should display interim transcript', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: true,
        isVoiceActive: false,
        error: null,
        transcript: 'hello world',
        interimTranscript: 'hello world',
        finalTranscript: '',
        confidence: 0.8,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} showTranscript={true} />);
      
      // Check for interim transcript in the display (should appear in italic)
      const interimText = screen.getAllByText('hello world');
      expect(interimText.length).toBeGreaterThan(0);
    });

    it('should show confidence when enabled', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: false,
        isVoiceActive: false,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: 'test transcript',
        confidence: 0.85,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} showConfidence={true} />);
      
      expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: false,
        isVoiceActive: false,
        error: 'Microphone access denied',
        transcript: '',
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} />);
      
      expect(screen.getByText('Voice input error')).toBeInTheDocument();
      expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
    });

    it('should allow switching to text input on error', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      const mockResetError = vi.fn();
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: false,
        isVoiceActive: false,
        error: 'Test error',
        transcript: '',
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: mockResetError,
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} />);
      
      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);
      
      expect(mockResetError).toHaveBeenCalled();
    });

    it('should show not supported message', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: false,
        isListening: false,
        isVoiceActive: false,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(<VoiceInput {...defaultProps} />);
      
      expect(screen.getByText('Voice input not available')).toBeInTheDocument();
      expect(screen.getByText(/browser doesn't support speech recognition/)).toBeInTheDocument();
    });
  });

  describe('Settings', () => {
    it('should update speech recognition settings', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      const mockUpdateSettings = vi.fn();
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: false,
        isVoiceActive: false,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: '',
        confidence: 0,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: mockUpdateSettings
      });

      render(
        <VoiceInput 
          {...defaultProps} 
          language="es-ES"
          continuous={true}
          interimResults={false}
        />
      );
      
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        language: 'es-ES',
        continuous: true,
        interimResults: false,
        maxAlternatives: 3
      });
    });
  });

  describe('Auto-submit', () => {
    it('should auto-submit when confidence threshold is met', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      const onSubmit = vi.fn();
      
      // Mock the hook to simulate final transcript with high confidence
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: false,
        isVoiceActive: false,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: 'test message',
        confidence: 0.9,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(
        <VoiceInput 
          {...defaultProps} 
          onSubmit={onSubmit}
          autoSubmitOnSpeech={true}
          confidenceThreshold={0.8}
        />
      );
      
      // The effect should trigger auto-submit
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('test message');
      });
    });

    it('should not auto-submit when confidence is below threshold', async () => {
      const { useSpeechRecognition } = await import('../../../hooks/useSpeechRecognition');
      const onSubmit = vi.fn();
      
      (useSpeechRecognition as any).mockReturnValue({
        isSupported: true,
        isListening: false,
        isVoiceActive: false,
        error: null,
        transcript: '',
        interimTranscript: '',
        finalTranscript: 'test message',
        confidence: 0.5,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        clearTranscript: vi.fn(),
        resetError: vi.fn(),
        updateSettings: vi.fn()
      });

      render(
        <VoiceInput 
          {...defaultProps} 
          onSubmit={onSubmit}
          autoSubmitOnSpeech={true}
          confidenceThreshold={0.8}
        />
      );
      
      // Should not auto-submit
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});