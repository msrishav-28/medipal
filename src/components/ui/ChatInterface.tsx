import { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { VoiceInput } from './VoiceInput';
import { Medication, IntakeRecord } from '@/types';
import { cn } from '@/utils/cn';
import Button from './Button';
import Card from './Card';

export interface ChatInterfaceProps {
  userId: string;
  medications?: Medication[];
  intakeRecords?: IntakeRecord[];
  className?: string;
  height?: string;
  showQuickSuggestions?: boolean;
  showApiKeyInput?: boolean;
}

export function ChatInterface({
  userId,
  medications = [],
  intakeRecords = [],
  className,
  height = '600px',
  showQuickSuggestions = true,
  showApiKeyInput = true
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    regenerateLastResponse,
    quickSuggestions,
    isConfigured,
    setApiKey: updateApiKey,
    executeAction
  } = useAIChat(userId, medications, intakeRecords);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    await sendMessage(message);
    setInputValue('');
  };

  const handleQuickSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      updateApiKey(apiKey.trim());
      setShowApiKeyForm(false);
      setApiKey('');
    }
  };

  const handleActionClick = async (action: any) => {
    await executeAction(action);
  };

  return (
    <div className={cn('flex flex-col bg-neutral-50 rounded-lg border border-neutral-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800">MediCare AI Assistant</h3>
            <p className="text-sm text-neutral-600">
              {isConfigured ? 'Ready to help with your medications' : 'API key required'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showApiKeyInput && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowApiKeyForm(!showApiKeyForm)}
              className="text-xs"
            >
              {isConfigured ? 'Update API Key' : 'Set API Key'}
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={clearMessages}
            className="text-xs"
          >
            Clear Chat
          </Button>
        </div>
      </div>

      {/* API Key Form */}
      {showApiKeyForm && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter OpenAI API key..."
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
            />
            <Button size="sm" onClick={handleApiKeySubmit}>
              Save
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowApiKeyForm(false)}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Your API key is stored locally and used only for AI responses. Without it, you'll get basic fallback responses.
          </p>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ height, maxHeight: height }}
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onActionClick={handleActionClick}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 max-w-md">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="font-medium">Error</div>
                  <div>{error}</div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={regenerateLastResponse}
                    className="mt-2 text-xs"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {showQuickSuggestions && quickSuggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-neutral-200 bg-white">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-neutral-600 self-center">Quick suggestions:</span>
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                size="sm"
                variant="secondary"
                onClick={() => handleQuickSuggestionClick(suggestion)}
                className="text-xs whitespace-nowrap"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-200 bg-white rounded-b-lg">
        <VoiceInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSendMessage}
          placeholder="Ask me about your medications..."
          disabled={isLoading}
          autoSubmitOnSpeech={true}
          confidenceThreshold={0.7}
          language="en-US"
          continuous={false}
          interimResults={true}
          showTranscript={false}
          className="w-full"
        />
      </div>
    </div>
  );
}

// Standalone chat demo component
export function ChatDemo() {
  // Mock data for demo
  const mockMedications: Medication[] = [
    {
      id: '1',
      userId: 'demo-user',
      name: 'Metformin',
      dosage: '500mg',
      form: 'tablet',
      scheduleType: 'time-based',
      times: ['08:00', '20:00'],
      instructions: 'Take with food',
      startDate: new Date(),
      refillReminder: 7,
      totalPills: 60,
      remainingPills: 45,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      userId: 'demo-user',
      name: 'Lisinopril',
      dosage: '10mg',
      form: 'tablet',
      scheduleType: 'time-based',
      times: ['09:00'],
      instructions: 'Take in the morning',
      startDate: new Date(),
      refillReminder: 5,
      totalPills: 30,
      remainingPills: 8,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-h2 mb-4">AI Chat Interface Demo</h2>
        <p className="text-neutral-600 mb-6">
          Try asking questions like "Did I take my morning medications?" or "What is Metformin for?"
        </p>
        
        <ChatInterface
          userId="demo-user"
          medications={mockMedications}
          intakeRecords={[]}
          height="500px"
          showQuickSuggestions={true}
          showApiKeyInput={true}
        />
      </Card>
    </div>
  );
}