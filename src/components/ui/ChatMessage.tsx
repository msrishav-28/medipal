import { ChatMessage as ChatMessageType, ChatAction } from '@/services/aiService';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface ChatMessageProps {
  message: ChatMessageType;
  onActionClick?: (action: ChatAction) => void;
  className?: string;
}

export function ChatMessage({ message, onActionClick, className }: ChatMessageProps) {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start', className)}>
      <div className={cn('max-w-[80%] flex', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar */}
        <div className={cn('flex-shrink-0', isUser ? 'ml-3' : 'mr-3')}>
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              isUser
                ? 'bg-primary-blue text-white'
                : 'bg-green-100 text-green-700'
            )}
          >
            {isUser ? 'U' : 'AI'}
          </div>
        </div>

        {/* Message content */}
        <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
          {/* Message bubble */}
          <div
            className={cn(
              'px-4 py-3 rounded-2xl text-sm leading-relaxed',
              isUser
                ? 'bg-primary-blue text-white rounded-br-md'
                : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md shadow-sm'
            )}
          >
            <div className="whitespace-pre-wrap">{message.content}</div>

            {/* Confidence indicator for AI messages */}
            {isAssistant && message.metadata?.confidence !== undefined && (
              <div className="mt-2 text-xs opacity-70">
                Confidence: {Math.round(message.metadata.confidence * 100)}%
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isAssistant && message.metadata?.actions && message.metadata.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.metadata.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="secondary"
                  onClick={() => onActionClick?.(action)}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Medication info */}
          {isAssistant && message.metadata?.medications && message.metadata.medications.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.metadata.medications.map((medication, index) => (
                <div
                  key={index}
                  className="text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                >
                  <div className="font-medium text-blue-800">{medication.name}</div>
                  <div className="text-blue-600">{medication.dosage}</div>
                  {medication.instructions && (
                    <div className="text-blue-600 mt-1">{medication.instructions}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-1 text-xs text-neutral-500">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Typing indicator component
export interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex justify-start', className)}>
      <div className="flex flex-row">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
            AI
          </div>
        </div>

        {/* Typing animation */}
        <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}