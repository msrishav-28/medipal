import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useVoice } from '@/hooks/useVoice';

interface VoiceControlProps {
  text?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

export function VoiceControl({
  text,
  autoPlay = false,
  showControls = true,
  className = ''
}: VoiceControlProps) {
  const {
    isSupported,
    settings,
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    error
  } = useVoice();

  const [hasPlayed, setHasPlayed] = useState(false);

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && text && settings.enabled && !hasPlayed) {
      handleSpeak();
      setHasPlayed(true);
    }
  }, [autoPlay, text, settings.enabled, hasPlayed]);

  const handleSpeak = async () => {
    if (!text) return;
    
    try {
      await speak(text);
    } catch (error) {
      console.error('Failed to speak text:', error);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handlePause = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  if (!isSupported || !settings.enabled) {
    return null;
  }

  if (!showControls) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Play/Speak Button */}
      {!isSpeaking && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSpeak}
          disabled={!text}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          title="Play voice announcement"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span className="text-sm">Play</span>
        </Button>
      )}

      {/* Pause/Resume Button */}
      {isSpeaking && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePause}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 4h10a1 1 0 001-1V7a1 1 0 00-1-1H6a1 1 0 00-1 1v10a1 1 0 001 1z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          )}
          <span className="text-sm">{isPaused ? 'Resume' : 'Pause'}</span>
        </Button>
      )}

      {/* Stop Button */}
      {isSpeaking && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleStop}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50"
          title="Stop"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
          <span className="text-sm">Stop</span>
        </Button>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && !isPaused && (
        <div className="flex items-center gap-1 text-primary-600">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-current rounded-full animate-pulse"></div>
            <div className="w-1 h-4 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-3 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-xs">Speaking...</span>
        </div>
      )}

      {/* Paused Indicator */}
      {isPaused && (
        <div className="flex items-center gap-1 text-warning-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
          <span className="text-xs">Paused</span>
        </div>
      )}

      {/* Error Indicator */}
      {error && (
        <div className="flex items-center gap-1 text-error-600" title={error}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-xs">Voice Error</span>
        </div>
      )}
    </div>
  );
}
