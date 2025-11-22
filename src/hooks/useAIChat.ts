import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService, ChatMessage, ChatContext, AIResponse, ChatAction } from '@/services/aiService';
import { Medication, IntakeRecord } from '@/types';

export interface UseAIChatReturn {
  // Messages
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  regenerateLastResponse: () => Promise<void>;
  
  // Quick suggestions
  quickSuggestions: string[];
  refreshSuggestions: () => void;
  
  // Configuration
  isConfigured: boolean;
  setApiKey: (apiKey: string) => void;
  
  // Context management
  updateContext: (context: Partial<ChatContext>) => void;
  
  // Action handling
  executeAction: (action: ChatAction) => Promise<void>;
}

export function useAIChat(
  userId: string,
  medications: Medication[] = [],
  intakeRecords: IntakeRecord[] = []
): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const [context, setContext] = useState<ChatContext>({
    userId,
    medications,
    recentIntakeRecords: intakeRecords,
    conversationHistory: []
  });

  const messagesRef = useRef<ChatMessage[]>([]);
  const contextRef = useRef<ChatContext>(context);

  // Update refs when state changes
  useEffect(() => {
    messagesRef.current = messages;
    contextRef.current = context;
  }, [messages, context]);

  // Update context when props change
  useEffect(() => {
    setContext(prev => ({
      ...prev,
      medications,
      recentIntakeRecords: intakeRecords
    }));
  }, [medications, intakeRecords]);

  // Generate initial quick suggestions
  useEffect(() => {
    const suggestions = aiService.generateQuickSuggestions(context);
    setQuickSuggestions(suggestions);
  }, [context]);

  // Add welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        type: 'assistant',
        content: "Hello! I'm your MediCare AI assistant. I'm here to help you with your medications. You can ask me about your medication schedule, whether you've taken your pills, or any questions about your prescriptions. How can I help you today?",
        timestamp: new Date(),
        metadata: {
          confidence: 1.0
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Update context with current conversation
      const currentContext: ChatContext = {
        ...contextRef.current,
        conversationHistory: [...messagesRef.current, userMessage]
      };

      // Get AI response
      const aiResponse: AIResponse = await aiService.generateResponse(content.trim(), currentContext);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        metadata: {
          ...(aiResponse.medications ? { medications: aiResponse.medications } : {}),
          ...(aiResponse.actions ? { actions: aiResponse.actions } : {}),
          confidence: aiResponse.confidence
        }
      };

      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);

      // Update quick suggestions based on new context
      const newSuggestions = aiService.generateQuickSuggestions({
        ...currentContext,
        conversationHistory: [...currentContext.conversationHistory, assistantMessage]
      });
      setQuickSuggestions(newSuggestions);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);

      // Add error message
      const errorResponse: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again or use the text input to ask your question.",
        timestamp: new Date(),
        metadata: {
          confidence: 0
        }
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    
    // Reset quick suggestions
    const suggestions = aiService.generateQuickSuggestions(contextRef.current);
    setQuickSuggestions(suggestions);
  }, []);

  const regenerateLastResponse = useCallback(async (): Promise<void> => {
    const lastUserMessage = messagesRef.current
      .slice()
      .reverse()
      .find(msg => msg.type === 'user');

    if (!lastUserMessage) return;

    // Remove the last assistant message if it exists
    setMessages(prev => {
      const lastIndex = prev.length - 1;
      const lastMessage = prev[lastIndex];
      if (lastIndex >= 0 && lastMessage && lastMessage.type === 'assistant') {
        return prev.slice(0, lastIndex);
      }
      return prev;
    });

    // Regenerate response
    await sendMessage(lastUserMessage.content);
  }, [sendMessage]);

  const refreshSuggestions = useCallback(() => {
    const suggestions = aiService.generateQuickSuggestions(contextRef.current);
    setQuickSuggestions(suggestions);
  }, []);

  const setApiKey = useCallback((apiKey: string) => {
    aiService.setApiKey(apiKey);
  }, []);

  const updateContext = useCallback((newContext: Partial<ChatContext>) => {
    setContext(prev => ({ ...prev, ...newContext }));
  }, []);

  const executeAction = useCallback(async (action: ChatAction): Promise<void> => {
    // This would integrate with the medication management system
    // For now, we'll just add a message about the action
    
    let actionMessage = '';
    
    switch (action.type) {
      case 'take_medication':
        actionMessage = `✅ Marked ${action.data?.medication?.name || 'medication'} as taken`;
        break;
      case 'skip_medication':
        actionMessage = `⏭️ Skipped ${action.data?.medication?.name || 'medication'}`;
        break;
      case 'snooze_medication':
        actionMessage = `⏰ Snoozed ${action.data?.medication?.name || 'medication'} for 10 minutes`;
        break;
      case 'view_medication':
        actionMessage = `📋 Viewing details for ${action.data?.medication?.name || 'medication'}`;
        break;
      case 'add_medication':
        actionMessage = `➕ Opening add medication form`;
        break;
      default:
        actionMessage = `Executed action: ${action.label}`;
    }

    const actionResponse: ChatMessage = {
      id: `action-${Date.now()}`,
      type: 'assistant',
      content: actionMessage,
      timestamp: new Date(),
      metadata: {
        confidence: 1.0
      }
    };

    setMessages(prev => [...prev, actionResponse]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    regenerateLastResponse,
    quickSuggestions,
    refreshSuggestions,
    isConfigured: aiService.isConfigured(),
    setApiKey,
    updateContext,
    executeAction
  };
}