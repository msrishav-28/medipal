import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ocrService } from '../ocrService';

// Mock Tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => ({
    recognize: vi.fn(),
    terminate: vi.fn(),
  })),
}));

describe('OCRService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parsePrescriptionText', () => {
    it('parses medication name correctly', () => {
      const ocrResult = {
        text: 'METFORMIN HCL 500MG TABLETS\nTake twice daily with food\nQty: 60',
        confidence: 85,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBe('Metformin Hcl');
      expect(parsed.dosage).toBe('500MG');
      expect(parsed.confidence).toBe(85);
    });

    it('parses dosage information correctly', () => {
      const ocrResult = {
        text: 'Lisinopril 10mg tablets\nTake once daily\n#30',
        confidence: 90,
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
          confidence: 80,
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
          confidence: 80,
          words: [],
        };

        const parsed = ocrService.parsePrescriptionText(ocrResult);
        expect(parsed.quantity).toBe(expectedQty);
      });
    });

    it('parses instructions correctly', () => {
      const ocrResult = {
        text: 'Metformin 500mg\nTake twice daily with meals\nDo not crush',
        confidence: 85,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.instructions).toContain('twice daily with meals');
    });

    it('parses prescriber information', () => {
      const ocrResult = {
        text: 'Prescribed by Dr. Smith\nMetformin 500mg tablets',
        confidence: 80,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.prescriber).toContain('Dr. Smith');
    });

    it('parses pharmacy information', () => {
      const ocrResult = {
        text: 'CVS Pharmacy\n123 Main St\nMetformin 500mg',
        confidence: 80,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.pharmacy).toContain('CVS Pharmacy');
    });

    it('parses RX number', () => {
      const ocrResult = {
        text: 'RX: 1234567\nMetformin 500mg tablets',
        confidence: 80,
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
        
        Take 1 tablet by mouth twice daily with meals
        
        Qty: 60 (Sixty)
        Refills: 5
        
        Prescribed by: DR. JANE SMITH
        Date filled: 01/15/2024`,
        confidence: 88,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBe('Metformin Hcl');
      expect(parsed.dosage).toBe('500MG');
      expect(parsed.form).toBe('tablet');
      expect(parsed.quantity).toBe(60);
      expect(parsed.instructions).toContain('twice daily with meals');
      expect(parsed.prescriber).toContain('DR. JANE SMITH');
      expect(parsed.pharmacy).toContain('CVS PHARMACY');
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
        confidence: 85,
      };

      const validation = ocrService.validateParsedData(parsedData);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('identifies missing medication name', () => {
      const parsedData = {
        dosage: '500mg',
        form: 'tablet' as const,
        confidence: 85,
      };

      const validation = ocrService.validateParsedData(parsedData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Medication name not found or too short');
    });

    it('identifies missing dosage', () => {
      const parsedData = {
        medicationName: 'Metformin',
        form: 'tablet' as const,
        confidence: 85,
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

  describe('cleanMedicationName', () => {
    it('cleans medication names correctly', () => {
      const testCases = [
        { input: 'METFORMIN HCL', expected: 'Metformin Hcl' },
        { input: 'generic aspirin tablets', expected: 'Aspirin' },
        { input: 'LISINOPRIL 10MG', expected: 'Lisinopril' },
        { input: 'medication vitamin d3 capsules', expected: 'Vitamin D3' },
      ];

      testCases.forEach(({ input, expected }) => {
        // Access private method through type assertion for testing
        const cleanedName = (ocrService as any).cleanMedicationName(input);
        expect(cleanedName).toBe(expected);
      });
    });
  });

  describe('error handling', () => {
    it('handles OCR initialization failure', async () => {
      const mockCreateWorker = vi.fn().mockRejectedValue(new Error('OCR init failed'));
      vi.doMock('tesseract.js', () => ({
        createWorker: mockCreateWorker,
      }));

      await expect(ocrService.initialize()).rejects.toThrow('OCR service initialization failed');
    });

    it('handles text extraction failure', async () => {
      const mockWorker = {
        recognize: vi.fn().mockRejectedValue(new Error('Recognition failed')),
        terminate: vi.fn(),
      };

      // Mock the worker to be already initialized
      (ocrService as any).worker = mockWorker;
      (ocrService as any).isInitialized = true;

      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(ocrService.extractTextFromImage(testFile)).rejects.toThrow('Failed to extract text from image');
    });
  });

  describe('edge cases', () => {
    it('handles empty OCR text', () => {
      const ocrResult = {
        text: '',
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
        confidence: 80,
        words: [],
      };

      const parsed = ocrService.parsePrescriptionText(ocrResult);

      expect(parsed.medicationName).toBeDefined();
      expect(parsed.dosage).toBe('500mg');
    });
  });
});