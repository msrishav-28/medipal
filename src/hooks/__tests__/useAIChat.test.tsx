import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIChat } from '../useAIChat';
import { Medication } from '@/types';

// Mock the AI service
vi.mock('../../services/aiService', () => ({
  aiService: {
    generateResponse: vi.fn(),
    generateQuickSuggestions: vi.fn(),
    isConfigured: vi.fn(),
    setApiKey: vi.fn()
  }
}));

describe('useAIChat', () => {
  const mockMedications: Medication[] = [
    {
      id: '1',
      userId: 'test-user',
      name: 'Metformin',
      dosage: '500mg',
      form: 'tablet',
      scheduleType: 'time-based',
      times: ['08:00', '20:00'],
      instructions: 'Take with food',
      startDate: new Date(),
      refillReminder: 7,
      totalPills: 60,
      remainingPills: 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { aiService } = require('../../services/aiService');
    aiService.isConfigured.mockReturnValue(false);
    aiService.generateQuickSuggestions.mockReturnValue([
      'Did I take my morning medications?',
      'What time should I take my next dose?'
    ]);
  });

  describe('Initialization', () => {
    it('should initialize with welcome message', async () => {
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
      });

      expect(result.current.messages[0].type).toBe('assistant');
      expect(result.current.messages[0].content).toContain('MediCare AI assistant');
    });

    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isConfigured).toBe(false);
      expect(result.current.quickSuggestions).toHaveLength(2);
    });

    it('should update context when medications change', () => {
      const { result, rerender } = renderHook(
        ({ medications }) => useAIChat('test-user', medications, []),
        { initialProps: { medications: mockMedications } }
      );

      const newMedications = [
        ...mockMedications,
        {
          id: '2',
          userId: 'test-user',
          name: 'Lisinopril',
          dosage: '10mg',
          form: 'tablet',
          scheduleType: 'time-based',
          times: ['09:00'],
          instructions: 'Take in morning',
          startDate: new Date(),
          refillReminder: 5,
          totalPills: 30,
          remainingPills: 15,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      rerender({ medications: newMedications });

      // Context should be updated with new medications
      expect(result.current.quickSuggestions).toBeDefined();
    });
  });

  describe('Message Sending', () => {
    it('should send message and receive response', async () => {
      const { aiService } = require('../../services/aiService');
      
      aiService.generateResponse.mockResolvedValue({
        message: 'I can help you with your Metformin.',
        actions: [],
        medications: [],
        confidence: 0.9
      });

      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      await act(async () => {
        await result.current.sendMessage('Tell me about Metformin');
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(3); // welcome + user + assistant
      });

      const userMessage = result.current.messages[1];
      const assistantMessage = result.current.messages[2];

      expect(userMessage.type).toBe('user');
      expect(userMessage.content).toBe('Tell me about Metformin');
      expect(assistantMessage.type).toBe('assistant');
      expect(assistantMessage.content).toContain('Metformin');
    });

    it('should handle empty messages', async () => {
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      const initialMessageCount = result.current.messages.length;

      await act(async () => {
        await result.current.sendMessage('');
      });

      expect(result.current.messages).toHaveLength(initialMessageCount);
    });

    it('should handle whitespace-only messages', async () => {
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      const initialMessageCount = result.current.messages.length;

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(result.current.messages).toHaveLength(initialMessageCount);
    });

    it('should prevent sending while loading', async () => {
      const { aiService } = require('../../services/aiService');
      
      // Make the AI service hang to simulate loading
      let resolvePromise: (value: any) => void;
      const hangingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      aiService.generateResponse.mockReturnValue(hangingPromise);

      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      // Start first message
      act(() => {
        result.current.sendMessage('First message');
      });

      expect(result.current.isLoading).toBe(true);

      // Try to send second message while loading
      await act(async () => {
        await result.current.sendMessage('Second message');
      });

      // Should still only have the first message (plus welcome)
      expect(result.current.messages.filter(m => m.type === 'user')).toHaveLength(1);

      // Resolve the hanging promise
      resolvePromise!({
        message: 'Response',
        actions: [],
        medications: [],
        confidence: 0.9
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors', async () => {
      const { aiService } = require('../../services/aiService');
      
      aiService.generateResponse.mockRejectedValue(new Error('AI service error'));

      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('AI service error');
      });

      // Should add error message
      const errorMessage = result.current.messages.find(m => 
        m.content.includes('trouble responding')
      );
      expect(errorMessage).toBeDefined();
    });

    it('should clear error on successful message', async () => {
      const { aiService } = require('../../services/aiService');
      
      // First, cause an error
      aiService.generateResponse.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      await act(async () => {
        await result.current.sendMessage('Error message');
      });

      expect(result.current.error).toBe('Test error');

      // Then send successful message
      aiService.generateResponse.mockResolvedValue({
        message: 'Success response',
        actions: [],
        medications: [],
        confidence: 0.9
      });

      await act(async () => {
        await result.current.sendMessage('Success message');
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
    });
  });

  describe('Message Management', () => {
    it('should clear all messages', async () => {
      const { aiService } = require('../../services/aiService');
      
      aiService.generateResponse.mockResolvedValue({
        message: 'Test response',
        actions: [],
        medications: [],
        confidence: 0.9
      });

      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      // Send a message
      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      expect(result.current.messages.length).toBeGreaterThan(1);

      // Clear messages
      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
      expect(result.current.error).toBe(null);
    });

    it('should regenerate last response', async () => {
      const { aiService } = require('../../services/aiService');
      
      aiService.generateResponse
        .mockResolvedValueOnce({
          message: 'First response',
          actions: [],
          medications: [],
          confidence: 0.9
        })
        .mockResolvedValueOnce({
          message: 'Regenerated response',
          actions: [],
          medications: [],
          confidence: 0.9
        });

      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      // Send initial message
      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      const initialResponseCount = result.current.messages.filter(m => m.type === 'assistant').length;

      // Regenerate last response
      await act(async () => {
        await result.current.regenerateLastResponse();
      });

      await waitFor(() => {
        const responses = result.current.messages.filter(m => m.type === 'assistant');
        expect(responses.length).toBe(initialResponseCount + 1);
        expect(responses[responses.length - 1].content).toBe('Regenerated response');
      });
    });

    it('should handle regenerate when no user messages exist', async () => {
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      const initialMessageCount = result.current.messages.length;

      await act(async () => {
        await result.current.regenerateLastResponse();
      });

      // Should not change message count
      expect(result.current.messages).toHaveLength(initialMessageCount);
    });
  });

  describe('Quick Suggestions', () => {
    it('should refresh quick suggestions', () => {
      const { aiService } = require('../../services/aiService');
      
      aiService.generateQuickSuggestions
        .mockReturnValueOnce(['Suggestion 1', 'Suggestion 2'])
        .mockReturnValueOnce(['New Suggestion 1', 'New Suggestion 2']);

      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      expect(result.current.quickSuggestions).toEqual(['Suggestion 1', 'Suggestion 2']);

      act(() => {
        result.current.refreshSuggestions();
      });

      expect(result.current.quickSuggestions).toEqual(['New Suggestion 1', 'New Suggestion 2']);
    });

    it('should update suggestions after sending message', async () => {
      const { aiService } = require('../../services/aiService');
      
      aiService.generateResponse.mockResolvedValue({
        message: 'Response',
        actions: [],
        medications: [],
        confidence: 0.9
      });

      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      // Should have called generateQuickSuggestions again after response
      expect(aiService.generateQuickSuggestions).toHaveBeenCalledTimes(2); // Initial + after response
    });
  });

  describe('Configuration', () => {
    it('should set API key', () => {
      const { aiService } = require('../../services/aiService');
      
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      act(() => {
        result.current.setApiKey('test-api-key');
      });

      expect(aiService.setApiKey).toHaveBeenCalledWith('test-api-key');
    });

    it('should update context', () => {
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      act(() => {
        result.current.updateContext({
          userPreferences: {
            language: 'es-ES',
            timezone: 'America/New_York'
          }
        });
      });

      // Context should be updated (we can't directly test this, but it shouldn't throw)
      expect(result.current.quickSuggestions).toBeDefined();
    });
  });

  describe('Action Execution', () => {
    it('should execute actions', async () => {
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      const action = {
        type: 'take_medication' as const,
        medicationId: '1',
        label: 'Mark Metformin as taken',
        data: { medication: mockMedications[0] }
      };

      await act(async () => {
        await result.current.executeAction(action);
      });

      // Should add action response message
      const actionMessage = result.current.messages.find(m => 
        m.content.includes('Marked Metformin as taken')
      );
      expect(actionMessage).toBeDefined();
    });

    it('should handle different action types', async () => {
      const { result } = renderHook(() => 
        useAIChat('test-user', mockMedications, [])
      );

      const actions = [
        { type: 'skip_medication' as const, label: 'Skip dose', data: { medication: mockMedications[0] } },
        { type: 'snooze_medication' as const, label: 'Snooze', data: { medication: mockMedications[0] } },
        { type: 'view_medication' as const, label: 'View details', data: { medication: mockMedications[0] } },
        { type: 'add_medication' as const, label: 'Add medication', data: {} }
      ];

      for (const action of actions) {
        await act(async () => {
          await result.current.executeAction(action);
        });
      }

      // Should have added action messages for each
      expect(result.current.messages.filter(m => m.type === 'assistant').length).toBeGreaterThan(actions.length);
    });
  });
});