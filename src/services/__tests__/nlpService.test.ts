import { describe, it, expect, beforeEach } from 'vitest';
import { nlpService } from '../nlpService';
import { Medication } from '@/types';

describe('NLPService', () => {
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
    },
    {
      id: '2',
      userId: 'test-user',
      name: 'Warfarin',
      dosage: '5mg',
      form: 'tablet',
      scheduleType: 'time-based',
      times: ['18:00'],
      instructions: 'Take at same time daily',
      startDate: new Date(),
      refillReminder: 5,
      totalPills: 30,
      remainingPills: 15,
      isActive: true,
      createdAt: new Date(),
      updatedDate: new Date()
    }
  ];

  describe('Medication Parsing', () => {
    it('should parse medication name and dosage', () => {
      const text = "I need to take Aspirin 325mg twice daily";
      const parsed = nlpService.parseMedicationFromText(text);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name.toLowerCase()).toContain('aspirin');
      expect(parsed[0].dosage).toBe('325mg');
      expect(parsed[0].confidence).toBeGreaterThan(0.5);
    });

    it('should parse multiple medications', () => {
      const text = "Take Metformin 500mg and Lisinopril 10mg in the morning";
      const parsed = nlpService.parseMedicationFromText(text);
      
      expect(parsed.length).toBeGreaterThanOrEqual(1);
      const medicationNames = parsed.map(m => m.name.toLowerCase());
      expect(medicationNames.some(name => name.includes('metformin'))).toBe(true);
    });

    it('should extract frequency information', () => {
      const text = "Take Metformin 500mg twice daily with meals";
      const parsed = nlpService.parseMedicationFromText(text);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].frequency).toContain('twice daily');
    });

    it('should extract time information', () => {
      const text = "Take medication at 8:00 AM and 6:00 PM";
      const parsed = nlpService.parseMedicationFromText(text);
      
      if (parsed.length > 0 && parsed[0].times) {
        expect(parsed[0].times.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty or invalid input', () => {
      const parsed = nlpService.parseMedicationFromText("");
      expect(parsed).toHaveLength(0);
    });
  });

  describe('Intent Recognition', () => {
    it('should recognize add medication intent', () => {
      const text = "I need to add a new medication called Aspirin";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      expect(intent.type).toBe('add_medication');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize check status intent', () => {
      const text = "Did I take my Metformin this morning?";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      expect(intent.type).toBe('check_status');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize get info intent', () => {
      const text = "What is Metformin used for?";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      expect(intent.type).toBe('get_info');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize mark taken intent', () => {
      const text = "I just took my evening medications";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      expect(intent.type).toBe('mark_taken');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize skip dose intent', () => {
      const text = "I want to skip my afternoon dose today";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      expect(intent.type).toBe('skip_dose');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize snooze intent', () => {
      const text = "Remind me in 10 minutes";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      expect(intent.type).toBe('snooze');
      expect(intent.confidence).toBeGreaterThan(0.5);
    });

    it('should extract medication entities from user medications', () => {
      const text = "Tell me about my Metformin";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      const medicationEntity = intent.entities.find(e => e.type === 'medication_name');
      expect(medicationEntity).toBeDefined();
      expect(medicationEntity?.value).toBe('Metformin');
    });

    it('should extract parameters for different intents', () => {
      const addText = "Add Aspirin 325mg twice daily";
      const addIntent = nlpService.recognizeIntent(addText, mockMedications);
      
      expect(addIntent.parameters).toBeDefined();
      
      const checkText = "Did I take Metformin at 8 AM?";
      const checkIntent = nlpService.recognizeIntent(checkText, mockMedications);
      
      expect(checkIntent.parameters.medicationName).toBe('Metformin');
    });
  });

  describe('Medication Conflicts', () => {
    it('should detect drug interactions', () => {
      const conflicts = nlpService.checkMedicationConflicts('Aspirin', mockMedications);
      
      // Should detect interaction with Warfarin
      expect(conflicts.length).toBeGreaterThan(0);
      const warfarinConflict = conflicts.find(c => 
        c.medications.includes('Warfarin') && c.medications.includes('Aspirin')
      );
      expect(warfarinConflict).toBeDefined();
      expect(warfarinConflict?.type).toBe('interaction');
    });

    it('should detect potential duplicate medications', () => {
      const conflicts = nlpService.checkMedicationConflicts('metformin', mockMedications);
      
      // Should detect similarity with existing Metformin
      expect(conflicts.length).toBeGreaterThan(0);
      const duplicateConflict = conflicts.find(c => c.type === 'dosage');
      expect(duplicateConflict).toBeDefined();
    });

    it('should return empty array for safe medications', () => {
      const conflicts = nlpService.checkMedicationConflicts('Vitamin D', mockMedications);
      
      // Vitamin D should not have conflicts with Metformin or Warfarin
      expect(conflicts).toHaveLength(0);
    });

    it('should assign appropriate severity levels', () => {
      const conflicts = nlpService.checkMedicationConflicts('Aspirin', mockMedications);
      
      if (conflicts.length > 0) {
        const severityLevels = ['low', 'medium', 'high', 'critical'];
        expect(severityLevels).toContain(conflicts[0].severity);
      }
    });
  });

  describe('Contextual Response Generation', () => {
    it('should generate appropriate response for check status intent', () => {
      const intent = {
        type: 'check_status' as const,
        confidence: 0.8,
        entities: [],
        parameters: { medicationName: 'Metformin' }
      };
      
      const response = nlpService.generateContextualResponse(intent, mockMedications);
      
      expect(response).toContain('Metformin');
      expect(response).toContain('500mg');
    });

    it('should generate appropriate response for get info intent', () => {
      const intent = {
        type: 'get_info' as const,
        confidence: 0.8,
        entities: [],
        parameters: { medicationName: 'Metformin' }
      };
      
      const response = nlpService.generateContextualResponse(intent, mockMedications);
      
      expect(response).toContain('Metformin');
      expect(response.length).toBeGreaterThan(10);
    });

    it('should generate appropriate response for mark taken intent', () => {
      const intent = {
        type: 'mark_taken' as const,
        confidence: 0.8,
        entities: [],
        parameters: { medicationName: 'Metformin' }
      };
      
      const response = nlpService.generateContextualResponse(intent, mockMedications);
      
      expect(response).toContain('Metformin');
      expect(response.toLowerCase()).toContain('mark');
    });

    it('should handle unknown medications gracefully', () => {
      const intent = {
        type: 'check_status' as const,
        confidence: 0.8,
        entities: [],
        parameters: { medicationName: 'UnknownMed' }
      };
      
      const response = nlpService.generateContextualResponse(intent, mockMedications);
      
      expect(response.length).toBeGreaterThan(0);
      expect(response).not.toContain('UnknownMed');
    });

    it('should provide helpful fallback responses', () => {
      const intent = {
        type: 'general_question' as const,
        confidence: 0.5,
        entities: [],
        parameters: {}
      };
      
      const response = nlpService.generateContextualResponse(intent, mockMedications);
      
      expect(response.length).toBeGreaterThan(0);
      expect(response.toLowerCase()).toContain('medication');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract medication names from user medication list', () => {
      const text = "I forgot to take my Metformin and Warfarin";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      const medicationEntities = intent.entities.filter(e => e.type === 'medication_name');
      expect(medicationEntities.length).toBeGreaterThanOrEqual(1);
      
      const medicationNames = medicationEntities.map(e => e.value);
      expect(medicationNames).toContain('Metformin');
    });

    it('should extract dosage entities', () => {
      const text = "Take 500mg twice daily";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      const dosageEntities = intent.entities.filter(e => e.type === 'dosage');
      expect(dosageEntities.length).toBeGreaterThanOrEqual(1);
      expect(dosageEntities[0].value).toContain('500mg');
    });

    it('should extract time entities', () => {
      const text = "Take medication at 8:00 AM";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      const timeEntities = intent.entities.filter(e => e.type === 'time');
      if (timeEntities.length > 0) {
        expect(timeEntities[0].value).toMatch(/8:00|8|morning/i);
      }
    });

    it('should provide confidence scores for entities', () => {
      const text = "Take Metformin 500mg";
      const intent = nlpService.recognizeIntent(text, mockMedications);
      
      intent.entities.forEach(entity => {
        expect(entity.confidence).toBeGreaterThan(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('String Similarity', () => {
    it('should detect similar medication names', () => {
      // Test with slight variations
      const conflicts1 = nlpService.checkMedicationConflicts('metformin', mockMedications);
      const conflicts2 = nlpService.checkMedicationConflicts('Metformin', mockMedications);
      
      // Both should detect the existing Metformin
      expect(conflicts1.length).toBeGreaterThan(0);
      expect(conflicts2.length).toBeGreaterThan(0);
    });

    it('should not flag completely different medications', () => {
      const conflicts = nlpService.checkMedicationConflicts('Completely Different Drug Name', mockMedications);
      
      // Should not detect similarity conflicts
      const similarityConflicts = conflicts.filter(c => c.type === 'dosage');
      expect(similarityConflicts).toHaveLength(0);
    });
  });
});