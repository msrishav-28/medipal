import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { VoiceInputButton, RecordingIndicator } from './VoiceInputButton';
import { cn } from '@/utils/cn';

export interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  showTranscript?: boolean;
  showConfidence?: boolean;
  autoSubmitOnSpeech?: boolean;
  confidenceThreshold?: number;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export function VoiceInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your message or click the microphone to speak...',
  disabled = false,
  autoFocus = false,
  maxLength,
  className,
  inputClassName,
  buttonClassName,
  showTranscript = true,
  showConfidence = false,
  autoSubmitOnSpeech = false,
  confidenceThreshold = 0.7,
  language = 'en-US',
  continuous = false,
  interimResults = true
}: VoiceInputProps) {
  const [hasUserInput, setHasUserInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    isSupported,
    isListening,
    isVoiceActive,
    error,
    transcript,
    interimTranscript,
    finalTranscript,
    confidence,
    startListening,
    stopListening,
    clearTranscript,
    resetError,
    updateSettings
  } = useSpeechRecognition();

  // Update speech recognition settings
  useEffect(() => {
    updateSettings({
      language,
      continuous,
      interimResults,
      maxAlternatives: 3
    });
  }, [language, continuous, interimResults, updateSettings]);

  // Handle speech recognition results
  useEffect(() => {
    if (finalTranscript && !hasUserInput) {
      const newValue = value ? `${value} ${finalTranscript}` : finalTranscript;
      onChange(newValue);
      
      // Auto-submit if enabled and confidence is high enough
      if (autoSubmitOnSpeech && confidence >= confidenceThreshold) {
        onSubmit?.(newValue);
      }
      
      clearTranscript();
    }
  }, [finalTranscript, hasUserInput, value, onChange, onSubmit, autoSubmitOnSpeech, confidence, confidenceThreshold, clearTranscript]);

  // Handle text input changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    
    onChange(newValue);
    setHasUserInput(true);
    
    // Reset user input flag after a delay
    setTimeout(() => setHasUserInput(false), 1000);
  };

  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.(value);
    }
    // Allow Shift+Enter to create new lines (default behavior)
  };

  // Handle voice input start
  const handleStartListening = async () => {
    try {
      await startListening();
    } catch (error) {
      console.error('Failed to start voice input:', error);
    }
  };

  // Handle voice input stop
  const handleStopListening = () => {
    stopListening();
    
    // Focus text input after stopping voice
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value, transcript]);

  // Display value (includes interim results when listening)
  const displayValue = isListening && interimTranscript
    ? `${value} ${interimTranscript}`.trim()
    : value;
  
  return (
    <div className={cn('relative', className)}>
      {/* Main input container */}
      <div className="relative flex items-end gap-2 p-3 bg-white border border-neutral-200 rounded-lg shadow-sm focus-within:border-primary-blue focus-within:ring-1 focus-within:ring-primary-blue">
        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening... Speak now' : placeholder}
          disabled={disabled || isListening}
          autoFocus={autoFocus}
          maxLength={maxLength}
          rows={1}
          className={cn(
            'flex-1 resize-none border-0 bg-transparent text-base placeholder-neutral-400 focus:outline-none focus:ring-0',
            isListening && 'text-neutral-600',
            inputClassName
          )}
          style={{ minHeight: '24px', maxHeight: '120px' }}
        />

        {/* Voice input button */}
        <VoiceInputButton
          isListening={isListening}
          isVoiceActive={isVoiceActive}
          isSupported={isSupported}
          disabled={disabled}
          size="sm"
          variant="secondary"
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          className={cn('flex-shrink-0', buttonClassName)}
        />
      </div>

      {/* Recording indicator */}
      {isListening && (
        <div className="mt-2">
          <RecordingIndicator
            isListening={isListening}
            isVoiceActive={isVoiceActive}
            className="justify-center"
          />
        </div>
      )}

      {/* Transcript and confidence display */}
      {showTranscript && (finalTranscript || interimTranscript) && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="text-blue-800">
            <span className="font-medium">Recognized: </span>
            <span className="text-blue-600">{finalTranscript}</span>
            {interimTranscript && (
              <span className="text-blue-400 italic"> {interimTranscript}</span>
            )}
          </div>
          {showConfidence && confidence > 0 && (
            <div className="mt-1 text-blue-600">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-red-800 font-medium">Voice input error</div>
              <div className="text-red-600">{error}</div>
              <button
                onClick={() => {
                  resetError();
                }}
                className="mt-1 text-red-700 hover:text-red-800 underline text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Not supported message */}
      {!isSupported && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-yellow-800 font-medium">Voice input not available</div>
              <div className="text-yellow-700">Your browser doesn't support speech recognition. You can still use text input.</div>
            </div>
          </div>
        </div>
      )}

      {/* Character count */}
      {maxLength && (
        <div className="mt-1 text-right text-xs text-neutral-500">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}