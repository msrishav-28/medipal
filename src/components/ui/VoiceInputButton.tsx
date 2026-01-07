import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

export interface VoiceInputButtonProps {
  isListening: boolean;
  isVoiceActive: boolean;
  isSupported: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  onStartListening: () => void;
  onStopListening: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function VoiceInputButton({
  isListening,
  isVoiceActive,
  isSupported,
  disabled = false,
  size = 'md',
  variant = 'primary',
  onStartListening,
  onStopListening,
  className,
  children
}: VoiceInputButtonProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Trigger pulse animation when voice is active
  useEffect(() => {
    if (isVoiceActive && isListening) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVoiceActive, isListening]);

  const handleClick = () => {
    if (disabled || !isSupported) return;

    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-lg'
  };

  const variantClasses = {
    primary: isListening
      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
      : 'bg-primary-blue hover:bg-blue-600 text-white shadow-md',
    secondary: isListening
      ? 'bg-red-100 hover:bg-red-200 text-red-700 border-2 border-red-300'
      : 'bg-white hover:bg-gray-50 text-primary-blue border-2 border-primary-blue',
    ghost: isListening
      ? 'bg-red-50 hover:bg-red-100 text-red-600'
      : 'bg-transparent hover:bg-blue-50 text-primary-blue'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed hover:bg-current';

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !isSupported}
      className={cn(
        // Base styles
        'relative rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2',

        // Size classes
        sizeClasses[size],

        // Variant classes
        !disabled && isSupported ? variantClasses[variant] : disabledClasses,

        // Listening state animations
        isListening && 'animate-pulse',

        // Voice activity pulse
        pulseAnimation && 'scale-110',

        className
      )}
      aria-label={
        !isSupported
          ? 'Voice input not supported'
          : isListening
            ? 'Stop voice input'
            : 'Start voice input'
      }
      title={
        !isSupported
          ? 'Voice input is not supported in this browser'
          : isListening
            ? 'Click to stop listening'
            : 'Click to start voice input'
      }
    >
      {/* Microphone Icon */}
      <svg
        className={cn(
          'transition-transform duration-200',
          isListening && 'scale-110'
        )}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isListening ? (
          // Stop icon when listening
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
        ) : (
          // Microphone icon when not listening
          <>
            <path
              d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
              fill="currentColor"
            />
            <path
              d="M19 10v2a7 7 0 0 1-14 0v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="12"
              y1="19"
              x2="12"
              y2="23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="8"
              y1="23"
              x2="16"
              y2="23"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>

      {/* Voice activity indicator rings */}
      {isListening && (
        <>
          <div
            className={cn(
              'absolute inset-0 rounded-full border-2 opacity-30',
              variant === 'primary' ? 'border-white' : 'border-current',
              isVoiceActive ? 'animate-ping' : 'animate-pulse'
            )}
            style={{ animationDuration: '1s' }}
          />
          <div
            className={cn(
              'absolute inset-0 rounded-full border opacity-20',
              variant === 'primary' ? 'border-white' : 'border-current',
              isVoiceActive ? 'animate-ping' : 'animate-pulse'
            )}
            style={{
              animationDuration: '1.5s',
              animationDelay: '0.2s'
            }}
          />
        </>
      )}

      {/* Custom children content */}
      {children}
    </button>
  );
}

// Recording state indicator component
export interface RecordingIndicatorProps {
  isListening: boolean;
  isVoiceActive: boolean;
  className?: string;
}

export function RecordingIndicator({
  isListening,
  isVoiceActive,
  className
}: RecordingIndicatorProps) {
  if (!isListening) return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div className="flex items-center gap-1">
        <div
          className={cn(
            'w-2 h-2 rounded-full transition-colors duration-200',
            isVoiceActive ? 'bg-green-500' : 'bg-red-500'
          )}
        />
        <span className="text-neutral-600">
          {isVoiceActive ? 'Listening...' : 'Speak now'}
        </span>
      </div>

      {/* Audio level bars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={cn(
              'w-1 bg-primary-blue rounded-full transition-all duration-150',
              isVoiceActive
                ? `h-${Math.min(bar * 2, 6)} animate-pulse`
                : 'h-2 opacity-30'
            )}
            style={{
              animationDelay: `${bar * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    </div>
  );
}