import { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { VoiceInput } from './VoiceInput';
import { Medication, IntakeRecord } from '@/types';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button'; // Corrected
import { Input } from '@/components/ui/Input';   // Corrected
import { GlassCard } from '@/components/ui/GlassCard';
import { Bot, Key, Trash2, Save, X, Sparkles, AlertCircle } from 'lucide-react';

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
    <GlassCard className={cn('flex flex-col overflow-hidden p-0', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground font-heading">MediCare Assistant</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {isConfigured ? (
                <span className="flex items-center gap-1 text-green-500"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online</span>
              ) : (
                <span className="flex items-center gap-1 text-orange-500"><AlertCircle className="w-3 h-3" /> Setup Required</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showApiKeyInput && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowApiKeyForm(!showApiKeyForm)}
              className="text-xs gap-2 border-white/10 hover:bg-white/10"
            >
              <Key className="w-3 h-3" />
              {isConfigured ? 'Update Key' : 'Set API Key'}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearMessages}
            className="text-xs gap-2 text-muted-foreground hover:text-red-400"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </Button>
        </div>
      </div>

      {/* API Key Form */}
      {showApiKeyForm && (
        <div className="p-4 bg-orange-500/10 border-b border-orange-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter OpenAI API key..."
              className="flex-1 bg-black/20 border-white/10 text-sm"
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleApiKeySubmit()}
            />
            <Button size="sm" onClick={handleApiKeySubmit} className="gap-2">
              <Save className="w-3 h-3" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowApiKeyForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-orange-400 mt-2 flex items-center gap-1">
            <Key className="w-3 h-3" />
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 relative"
        style={{ height: height ? 'auto' : undefined, minHeight: '300px' }}
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50">
            <Bot className="w-16 h-16 mb-4 text-primary/50" />
            <p>Start a conversation to get help with your health.</p>
          </div>
        )}

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
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive max-w-md backdrop-blur-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold">Error</div>
                  <div>{error}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={regenerateLastResponse}
                    className="mt-2 text-xs border-destructive/30 hover:bg-destructive/10"
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
        <div className="px-4 py-3 border-t border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Suggestions:
            </span>
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                size="sm"
                variant="secondary"
                onClick={() => handleQuickSuggestionClick(suggestion)}
                className="text-xs whitespace-nowrap bg-white/10 hover:bg-white/20 border border-white/10"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md rounded-b-2xl">
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
    </GlassCard>
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
      <GlassCard className="p-8">
        <h2 className="text-3xl font-heading font-bold mb-4">AI Chat Experience</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Try asking questions like "Did I take my morning medications?" or "What is Metformin for?"
        </p>

        <ChatInterface
          userId="demo-user"
          medications={mockMedications}
          intakeRecords={[]}
          height="500px"
          showQuickSuggestions={true}
          showApiKeyInput={true}
          className="shadow-2xl shadow-primary/10"
        />
      </GlassCard>
    </div>
  );
}