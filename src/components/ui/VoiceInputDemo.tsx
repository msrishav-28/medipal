import { useState } from 'react';
import { VoiceInput } from './VoiceInput';
import { VoiceInputButton } from './VoiceInputButton';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import Card from './Card';
import Button from './Button';

export function VoiceInputDemo() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  
  const {
    isSupported,
    isListening,
    isVoiceActive,
    error,
    transcript,
    confidence,
    startListening,
    stopListening,
    clearTranscript
  } = useSpeechRecognition();

  const handleSubmit = (text: string) => {
    if (text.trim()) {
      setMessages([...messages, text.trim()]);
      setMessage('');
    }
  };

  const handleClear = () => {
    setMessages([]);
    setMessage('');
    clearTranscript();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-h2 mb-4">Voice Input System Demo</h2>
        
        {/* Support status */}
        <div className="mb-4 p-3 rounded-lg bg-neutral-50">
          <div className="text-sm">
            <strong>Browser Support:</strong> {isSupported ? '✅ Supported' : '❌ Not Supported'}
          </div>
          {error && (
            <div className="text-red-600 text-sm mt-1">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Voice input component */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Voice Input with Text Fallback
          </label>
          <VoiceInput
            value={message}
            onChange={setMessage}
            onSubmit={handleSubmit}
            placeholder="Type your message or use voice input..."
            showTranscript={true}
            showConfidence={true}
            autoSubmitOnSpeech={false}
            confidenceThreshold={0.7}
            language="en-US"
            continuous={false}
            interimResults={true}
          />
        </div>

        {/* Standalone voice button */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Standalone Voice Button
          </label>
          <div className="flex items-center gap-4">
            <VoiceInputButton
              isListening={isListening}
              isVoiceActive={isVoiceActive}
              isSupported={isSupported}
              size="lg"
              variant="primary"
              onStartListening={startListening}
              onStopListening={stopListening}
            />
            <div className="text-sm text-neutral-600">
              {isListening ? (
                <div>
                  <div>🎤 Listening...</div>
                  {transcript && (
                    <div className="mt-1">
                      <strong>Transcript:</strong> {transcript}
                    </div>
                  )}
                  {confidence > 0 && (
                    <div>
                      <strong>Confidence:</strong> {Math.round(confidence * 100)}%
                    </div>
                  )}
                </div>
              ) : (
                'Click to start voice input'
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleSubmit(message)}
            disabled={!message.trim()}
            variant="primary"
          >
            Send Message
          </Button>
          <Button
            onClick={handleClear}
            variant="secondary"
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Messages display */}
      {messages.length > 0 && (
        <Card className="p-6">
          <h3 className="text-h3 mb-4">Messages ({messages.length})</h3>
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="text-sm text-blue-600 mb-1">
                  Message #{index + 1}
                </div>
                <div className="text-blue-800">{msg}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-neutral-50">
        <h3 className="text-h3 mb-3">How to Use</h3>
        <div className="space-y-2 text-sm text-neutral-700">
          <div>• <strong>Voice Input:</strong> Click the microphone button and speak clearly</div>
          <div>• <strong>Text Input:</strong> Type directly in the text area</div>
          <div>• <strong>Auto-stop:</strong> Voice input stops automatically after 3 seconds of silence</div>
          <div>• <strong>Fallback:</strong> If voice fails, you can always use text input</div>
          <div>• <strong>Submit:</strong> Press Enter or click "Send Message" to submit</div>
        </div>
      </Card>
    </div>
  );
}
