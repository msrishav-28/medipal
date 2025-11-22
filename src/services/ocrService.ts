import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface ParsedPrescription {
  medicationName?: string;
  dosage?: string;
  form?: 'tablet' | 'capsule' | 'liquid' | 'injection';
  quantity?: number;
  instructions?: string;
  prescriber?: string;
  pharmacy?: string;
  rxNumber?: string;
  confidence: number;
}

class OCRService {
  private worker: Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker('eng');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw new Error('OCR service initialization failed');
    }
  }

  async extractTextFromImage(imageFile: File | string): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      const result = await this.worker.recognize(imageFile);
      const resultData = result.data as any; // Tesseract.js types are incomplete
      
      return {
        text: resultData.text,
        confidence: resultData.confidence,
        words: (resultData.words || []).map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })),
      };
    } catch (error) {
      console.error('OCR text extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  parsePrescriptionText(ocrResult: OCRResult): ParsedPrescription {
    const text = ocrResult.text.toLowerCase();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const parsed: ParsedPrescription = {
      confidence: ocrResult.confidence,
    };

    // Common medication name patterns
    const medicationPatterns = [
      /(?:generic|brand|medication|drug)[\s:]*([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,
      /^([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+\d+\s*mg/i,
      /^([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+\d+\s*mcg/i,
    ];

    // Dosage patterns
    const dosagePatterns = [
      /(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?))/i,
      /(\d+(?:\.\d+)?\s*milligrams?)/i,
      /(\d+(?:\.\d+)?\s*micrograms?)/i,
    ];

    // Form patterns
    const formPatterns = [
      { pattern: /tablets?|tabs?/i, form: 'tablet' as const },
      { pattern: /capsules?|caps?/i, form: 'capsule' as const },
      { pattern: /liquid|solution|syrup|suspension/i, form: 'liquid' as const },
      { pattern: /injection|injectable|shot/i, form: 'injection' as const },
    ];

    // Quantity patterns
    const quantityPatterns = [
      /(?:qty|quantity|count)[\s:]*(\d+)/i,
      /(\d+)\s*(?:tablets?|capsules?|pills?)/i,
      /#(\d+)/,
    ];

    // Instructions patterns
    const instructionPatterns = [
      /(?:take|use|apply)[\s:]*(.*?)(?:\n|$)/i,
      /(?:directions?|instructions?)[\s:]*(.*?)(?:\n|$)/i,
      /(?:sig|directions?)[\s:]*(.*?)(?:\n|$)/i,
    ];

    // Prescriber patterns
    const prescriberPatterns = [
      /(?:dr\.?|doctor|physician|prescriber)[\s:]*([a-zA-Z\s]+)/i,
      /(?:prescribed by|written by)[\s:]*([a-zA-Z\s]+)/i,
    ];

    // Pharmacy patterns
    const pharmacyPatterns = [
      /(?:pharmacy|pharm)[\s:]*([a-zA-Z\s]+)/i,
      /(?:dispensed by|filled at)[\s:]*([a-zA-Z\s]+)/i,
    ];

    // RX number patterns
    const rxPatterns = [
      /(?:rx|prescription)[\s#:]*(\d+)/i,
      /(?:number|no\.?)[\s#:]*(\d+)/i,
    ];

    // Parse medication name
    for (const line of lines) {
      for (const pattern of medicationPatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 2) {
          parsed.medicationName = this.cleanMedicationName(match[1]);
          break;
        }
      }
      if (parsed.medicationName) break;
    }

    // Parse dosage
    for (const line of lines) {
      for (const pattern of dosagePatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          parsed.dosage = match[1].trim();
          break;
        }
      }
      if (parsed.dosage) break;
    }

    // Parse form
    for (const line of lines) {
      for (const formPattern of formPatterns) {
        if (formPattern.pattern.test(line)) {
          parsed.form = formPattern.form;
          break;
        }
      }
      if (parsed.form) break;
    }

    // Parse quantity
    for (const line of lines) {
      for (const pattern of quantityPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const qty = parseInt(match[1]);
          if (!isNaN(qty) && qty > 0 && qty < 1000) {
            parsed.quantity = qty;
            break;
          }
        }
      }
      if (parsed.quantity) break;
    }

    // Parse instructions
    for (const line of lines) {
      for (const pattern of instructionPatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].trim().length > 5) {
          parsed.instructions = match[1].trim();
          break;
        }
      }
      if (parsed.instructions) break;
    }

    // Parse prescriber
    for (const line of lines) {
      for (const pattern of prescriberPatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].trim().length > 2) {
          parsed.prescriber = match[1].trim();
          break;
        }
      }
      if (parsed.prescriber) break;
    }

    // Parse pharmacy
    for (const line of lines) {
      for (const pattern of pharmacyPatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].trim().length > 2) {
          parsed.pharmacy = match[1].trim();
          break;
        }
      }
      if (parsed.pharmacy) break;
    }

    // Parse RX number
    for (const line of lines) {
      for (const pattern of rxPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          parsed.rxNumber = match[1];
          break;
        }
      }
      if (parsed.rxNumber) break;
    }

    return parsed;
  }

  private cleanMedicationName(name: string): string {
    // Remove common prefixes/suffixes and clean up the name
    return name
      .replace(/^(generic|brand|medication|drug)\s+/i, '')
      .replace(/\s+(tablets?|capsules?|pills?|mg|mcg|g)$/i, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  // Utility method to validate if extracted data looks reasonable
  validateParsedData(parsed: ParsedPrescription): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!parsed.medicationName || parsed.medicationName.length < 2) {
      issues.push('Medication name not found or too short');
    }

    if (!parsed.dosage) {
      issues.push('Dosage information not found');
    }

    if (!parsed.form) {
      issues.push('Medication form not identified');
    }

    if (parsed.confidence < 60) {
      issues.push('Low OCR confidence - image may be unclear');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

export const ocrService = new OCRService();