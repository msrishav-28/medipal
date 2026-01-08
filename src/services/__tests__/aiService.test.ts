import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { aiService } from '../aiService';
import { Medication } from '@/types';

// Mock the NLP service
vi.mock('../nlpService', () => ({
  nlpService: {
    recognizeIntent: vi.fn(),
    checkMedicationConflicts: vi.fn(),
    generateContextualResponse: vi.fn(),
    parseMedicationFromText: vi.fn()
  }
}));

// Mock fetch for Gemini API calls
global.fetch = vi.fn();

describe('AIService', () => {
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

  const mockContext = {
    userId: 'test-user',
    medications: mockMedications,
    recentIntakeRecords: [],
    conversationHistory: []
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset AI service configuration
    aiService.setApiKey('');
  });

  describe('Configuration', () => {
    it('should detect when API key is not configured', () => {
      expect(aiService.isConfigured()).toBe(false);
    });

    it('should detect when API key is configured', () => {
      aiService.setApiKey('test-api-key');
      expect(aiService.isConfigured()).toBe(true);
    });

    it('should update configuration settings', () => {
      aiService.updateConfiguration({
        model: 'gemini-1.5-pro',
        maxTokens: 1000,
        temperature: 0.5
      });

      const config = aiService.getConfiguration();
      expect(config.model).toBe('gemini-1.5-pro');
      expect(config.maxTokens).toBe(1000);
      expect(config.temperature).toBe(0.5);
    });
  });

  describe('Response Generation - Fallback Mode', () => {
    it('should use NLP-based response when API key is not configured', async () => {
      const { nlpService } = await import('../nlpService');

      (nlpService.recognizeIntent as Mock).mockReturnValue({
        type: 'check_status',
        confidence: 0.8,
        entities: [],
        parameters: { medicationName: 'Metformin' }
      });

      (nlpService.checkMedicationConflicts as Mock).mockReturnValue([]);

      (nlpService.generateContextualResponse as Mock).mockReturnValue(
        'Let me check your Metformin status.'
      );

      const response = await aiService.generateResponse(
        'Did I take my Metformin?',
        mockContext
      );

      expect(response.message).toContain('Metformin');
      expect(response.confidence).toBeGreaterThan(0);
      expect(nlpService.recognizeIntent).toHaveBeenCalled();
    });

    it('should detect medication conflicts in fallback mode', async () => {
      const { nlpService } = await import('../nlpService');

      (nlpService.recognizeIntent as Mock).mockReturnValue({
        type: 'add_medication',
        confidence: 0.8,
        entities: [],
        parameters: { medicationName: 'Aspirin' }
      });

      (nlpService.checkMedicationConflicts as Mock).mockReturnValue([
        {
          type: 'interaction',
          severity: 'medium',
          message: 'Aspirin may interact with existing medications',
          medications: ['Aspirin', 'Metformin'],
          recommendation: 'Consult your doctor'
        }
      ]);

      (nlpService.generateContextualResponse as Mock).mockReturnValue(
        'I can help you add Aspirin.'
      );

      const response = await aiService.generateResponse(
        'Add Aspirin to my medications',
        mockContext
      );

      expect(response.message).toContain('IMPORTANT WARNINGS');
      expect(response.message).toContain('Aspirin may interact');
    });
  });

  describe('Response Generation - AI Mode', () => {
    beforeEach(() => {
      aiService.setApiKey('test-api-key');
    });

    it('should make API call when configured', async () => {
      const { nlpService } = await import('../nlpService');

      (nlpService.recognizeIntent as Mock).mockReturnValue({
        type: 'check_status',
        confidence: 0.8,
        entities: [],
        parameters: {}
      });

      (nlpService.checkMedicationConflicts as Mock).mockReturnValue([]);

      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'I can help you check your medication status.' }]
            }
          }]
        })
      });

      const response = await aiService.generateResponse(
        'How are my medications?',
        mockContext
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(response.message).toContain('medication status');
    });

    it('should handle API errors gracefully', async () => {
      const { nlpService } = await import('../nlpService');

      (nlpService.recognizeIntent as Mock).mockReturnValue({
        type: 'general_question',
        confidence: 0.5,
        entities: [],
        parameters: {}
      });

      (nlpService.generateContextualResponse as Mock).mockReturnValue(
        'I can help with your medications.'
      );

      (fetch as Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      const response = await aiService.generateResponse(
        'Hello',
        mockContext
      );

      // Should fall back to NLP response
      expect(response.message).toContain('medications');
      expect(nlpService.generateContextualResponse).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const { nlpService } = await import('../nlpService');

      (nlpService.recognizeIntent as Mock).mockReturnValue({
        type: 'general_question',
        confidence: 0.5,
        entities: [],
        parameters: {}
      });

      (nlpService.generateContextualResponse as Mock).mockReturnValue(
        'Network error fallback response.'
      );

      (fetch as Mock).mockRejectedValue(new Error('Network error'));

      const response = await aiService.generateResponse(
        'Test message',
        mockContext
      );

      expect(response.message).toContain('fallback');
    });
  });

  describe('Quick Suggestions', () => {
    it('should generate relevant quick suggestions', () => {
      const suggestions = aiService.generateQuickSuggestions(mockContext);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(4);

      // Should include medication-specific suggestions
      const hasMetforminSuggestion = suggestions.some(s =>
        s.toLowerCase().includes('metformin')
      );
      expect(hasMetforminSuggestion).toBe(true);
    });

    it('should limit suggestions to maximum of 4', () => {
      const suggestions = aiService.generateQuickSuggestions(mockContext);
      expect(suggestions.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Medication Parsing', () => {
    it('should delegate to NLP service for medication parsing', async () => {
      const { nlpService } = await import('../nlpService');

      (nlpService.parseMedicationFromText as Mock).mockReturnValue([
        {
          name: 'Aspirin',
          dosage: '325mg',
          confidence: 0.9
        }
      ]);

      const result = aiService.parseMedicationFromText('Take Aspirin 325mg');

      expect(nlpService.parseMedicationFromText).toHaveBeenCalledWith('Take Aspirin 325mg');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Aspirin');
    });
  });

  describe('Conflict Checking', () => {
    it('should delegate to NLP service for conflict checking', async () => {
      const { nlpService } = await import('../nlpService');

      (nlpService.checkMedicationConflicts as Mock).mockReturnValue([
        {
          type: 'interaction',
          severity: 'medium',
          message: 'Potential interaction detected',
          medications: ['Aspirin', 'Metformin'],
          recommendation: 'Consult doctor'
        }
      ]);

      const conflicts = aiService.checkMedicationConflicts('Aspirin', mockMedications);

      expect(nlpService.checkMedicationConflicts).toHaveBeenCalledWith('Aspirin', mockMedications);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('interaction');
    });
  });

  describe('Message Formatting', () => {
    it('should include conversation history in API calls', async () => {
      aiService.setApiKey('test-api-key');

      const { nlpService } = await import('../nlpService');

      (nlpService.recognizeIntent as Mock).mockReturnValue({
        type: 'general_question',
        confidence: 0.5,
        entities: [],
        parameters: {}
      });

      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'Response with history context.' }]
            }
          }]
        })
      });

      const contextWithHistory = {
        ...mockContext,
        conversationHistory: [
          {
            id: '1',
            type: 'user' as const,
            content: 'Previous question',
            timestamp: new Date()
          },
          {
            id: '2',
            type: 'assistant' as const,
            content: 'Previous answer',
            timestamp: new Date()
          }
        ]
      };

      await aiService.generateResponse('Follow up question', contextWithHistory);

      expect(fetch).toHaveBeenCalled();
      const fetchCall = (fetch as Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should include conversation history in contents
      expect(requestBody.contents.length).toBeGreaterThan(2);
    });
  });
});