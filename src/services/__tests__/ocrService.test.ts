import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ocrService } from '../ocrService';

// Mock fetch for Mistral OCR API calls
global.fetch = vi.fn();

describe('OCRService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ocrService.setApiKey('');
  });

  describe('Configuration', () => {
    it('should detect when API key is not configured', () => {
      expect(ocrService.isConfigured()).toBe(false);
    });

    it('should detect when API key is configured', () => {
      ocrService.setApiKey('test-api-key');
      expect(ocrService.isConfigured()).toBe(true);
    });
  });

  describe('extractTextFromImage', () => {
    it('should throw error when API key is not configured', async () => {
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await expect(ocrService.extractTextFromImage(testFile)).rejects.toThrow('not configured');
    });

    it('should make API call when configured', async () => {
      ocrService.setApiKey('test-api-key');

      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          pages: [{
            markdown: 'METFORMIN 500MG TABLETS\nTake twice daily with food'
          }]
        })
      });

      // Create a mock file
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const result = await ocrService.extractTextFromImage(testFile);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('mistral.ai'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(result.text).toContain('METFORMIN');
    });

    it('should handle API errors gracefully', async () => {
      ocrService.setApiKey('test-api-key');

      (fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' })
      });

      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(ocrService.extractTextFromImage(testFile)).rejects.toThrow('Failed to extract text');
    });
  });

  describe('parsePrescriptionText', () => {
    it('parses medication name correctly', () => {
      const ocrResult = {
        text: 'METFORMIN HCL 500MG TABLETS\nTake twice daily with food\nQty: 60',
        markdown: 'METFORMIN HCL 500MG TABLETS\nTake twice daily with food\nQty: 60',
        confidence: 95,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBe('Metformin Hcl');
      expect(parsed.dosage?.toLowerCase()).toBe('500mg');
      expect(parsed.confidence).toBe(95);
    });

    it('parses dosage information correctly', () => {
      const ocrResult = {
        text: 'Lisinopril 10mg tablets\nTake once daily\n#30',
        markdown: 'Lisinopril 10mg tablets\nTake once daily\n#30',
        confidence: 95,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBe('Lisinopril');
      expect(parsed.dosage).toBe('10mg');
      expect(parsed.form).toBe('tablet');
      expect(parsed.quantity).toBe(30);
    });

    it('parses different medication forms', () => {
      const testCases = [
        { text: 'Amoxicillin 250mg capsules', expectedForm: 'capsule' },
        { text: 'Cough syrup 100ml liquid', expectedForm: 'liquid' },
        { text: 'Insulin injection 10 units', expectedForm: 'injection' },
        { text: 'Aspirin 81mg tablets', expectedForm: 'tablet' },
      ];

      testCases.forEach(({ text, expectedForm }) => {
        const ocrResult = {
          text,
          markdown: text,
          confidence: 95,
          words: [],
        };

        const parsed = ocrService.parsePrescriptionText(ocrResult);
        expect(parsed.form).toBe(expectedForm);
      });
    });

    it('parses quantity information', () => {
      const testCases = [
        { text: 'Qty: 30 tablets', expectedQty: 30 },
        { text: 'Quantity 60', expectedQty: 60 },
        { text: '#90 pills', expectedQty: 90 },
        { text: '120 capsules total', expectedQty: 120 },
      ];

      testCases.forEach(({ text, expectedQty }) => {
        const ocrResult = {
          text,
          markdown: text,
          confidence: 95,
          words: [],
        };

        const parsed = ocrService.parsePrescriptionText(ocrResult);
        expect(parsed.quantity).toBe(expectedQty);
      });
    });

    it('parses instructions correctly', () => {
      const ocrResult = {
        text: 'Metformin 500mg\nTake twice daily with meals\nDo not crush',
        markdown: 'Metformin 500mg\nTake twice daily with meals\nDo not crush',
        confidence: 95,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.instructions).toContain('twice daily with meals');
    });

    it('parses prescriber information', () => {
      const ocrResult = {
        text: 'Prescribed by Dr. Smith\nMetformin 500mg tablets',
        markdown: 'Prescribed by Dr. Smith\nMetformin 500mg tablets',
        confidence: 95,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.prescriber?.toLowerCase()).toContain('smith');
    });

    it('parses pharmacy information', () => {
      const ocrResult = {
        text: 'CVS Pharmacy\n123 Main St\nMetformin 500mg',
        markdown: 'CVS Pharmacy\n123 Main St\nMetformin 500mg',
        confidence: 95,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.pharmacy).toBeDefined();
    });

    it('parses RX number', () => {
      const ocrResult = {
        text: 'RX: 1234567\nMetformin 500mg tablets',
        markdown: 'RX: 1234567\nMetformin 500mg tablets',
        confidence: 95,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.rxNumber).toBe('1234567');
    });

    it('handles complex prescription text', () => {
      const ocrResult = {
        text: `CVS PHARMACY
        123 MAIN STREET
        ANYTOWN, ST 12345
        
        RX: 0123456789
        
        METFORMIN HCL 500MG TABLETS
        Generic for GLUCOPHAGE
        
        Qty: 60 (Sixty)
        Refills: 5
        
        Take 1 tablet by mouth twice daily with meals
        
        Prescribed by: DR. JANE SMITH
        Date filled: 01/15/2024`,
        markdown: '',
        confidence: 95,
        words: [],
      };
      ocrResult.markdown = ocrResult.text;

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBe('Metformin Hcl');
      expect(parsed.dosage?.toLowerCase()).toBe('500mg');
      expect(parsed.form).toBe('tablet');
      expect(parsed.quantity).toBe(60);
      expect(parsed.instructions).toBeDefined();
      expect(parsed.prescriber).toBeDefined();
      expect(parsed.pharmacy).toBeDefined();
      expect(parsed.rxNumber).toBe('0123456789');
    });
  });

  describe('validateParsedData', () => {
    it('validates complete prescription data as valid', () => {
      const parsedData = {
        medicationName: 'Metformin',
        dosage: '500mg',
        form: 'tablet' as const,
        quantity: 60,
        confidence: 95,
      };

      const validation = ocrService.validateParsedData(parsedData);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('identifies missing medication name', () => {
      const parsedData = {
        dosage: '500mg',
        form: 'tablet' as const,
        confidence: 95,
      };

      const validation = ocrService.validateParsedData(parsedData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Medication name not found or too short');
    });

    it('identifies missing dosage', () => {
      const parsedData = {
        medicationName: 'Metformin',
        form: 'tablet' as const,
        confidence: 95,
      };

      const validation = ocrService.validateParsedData(parsedData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Dosage information not found');
    });

    it('identifies low confidence', () => {
      const parsedData = {
        medicationName: 'Metformin',
        dosage: '500mg',
        form: 'tablet' as const,
        confidence: 45,
      };

      const validation = ocrService.validateParsedData(parsedData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Low OCR confidence - image may be unclear');
    });

    it('identifies multiple issues', () => {
      const parsedData = {
        confidence: 30,
      };

      const validation = ocrService.validateParsedData(parsedData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(1);
      expect(validation.issues).toContain('Medication name not found or too short');
      expect(validation.issues).toContain('Dosage information not found');
      expect(validation.issues).toContain('Low OCR confidence - image may be unclear');
    });
  });

  describe('edge cases', () => {
    it('handles empty OCR text', () => {
      const ocrResult = {
        text: '',
        markdown: '',
        confidence: 0,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBeUndefined();
      expect(parsed.dosage).toBeUndefined();
      expect(parsed.confidence).toBe(0);
    });

    it('handles malformed text', () => {
      const ocrResult = {
        text: '!@#$%^&*()_+{}|:"<>?',
        markdown: '!@#$%^&*()_+{}|:"<>?',
        confidence: 20,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBeUndefined();
      expect(parsed.dosage).toBeUndefined();
    });

    it('handles very long medication names', () => {
      const ocrResult = {
        text: 'A'.repeat(100) + ' 500mg tablets',
        markdown: 'A'.repeat(100) + ' 500mg tablets',
        confidence: 95,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBeDefined();
      expect(parsed.dosage).toBe('500mg');
    });
  });

  describe('initialization', () => {
    it('initialize throws when API key not configured', async () => {
      await expect(ocrService.initialize()).rejects.toThrow('API key not configured');
    });

    it('initialize succeeds when API key is configured', async () => {
      ocrService.setApiKey('test-api-key');
      await expect(ocrService.initialize()).resolves.not.toThrow();
    });

    it('terminate completes without error', async () => {
      await expect(ocrService.terminate()).resolves.not.toThrow();
    });
  });
});