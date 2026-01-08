export interface OCRResult {
  text: string;
  confidence: number;
  markdown: string;
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
  private apiKey: string | null = null;
  private baseUrl = 'https://api.mistral.ai/v1';
  private model = 'mistral-ocr-latest';

  constructor() {
    this.apiKey = import.meta.env.VITE_MISTRAL_API_KEY || null;
  }

  /**
   * Set Mistral API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Check if OCR service is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey !== '';
  }

  /**
   * Convert File to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Extract text from image using Mistral OCR
   */
  async extractTextFromImage(imageFile: File | string): Promise<OCRResult> {
    if (!this.isConfigured()) {
      throw new Error('Mistral OCR service is not configured. Please set VITE_MISTRAL_API_KEY.');
    }

    try {
      let imageUrl: string;

      if (typeof imageFile === 'string') {
        // It's already a URL or base64 string
        imageUrl = imageFile;
      } else {
        // Convert File to base64
        imageUrl = await this.fileToBase64(imageFile);
      }

      const response = await fetch(`${this.baseUrl}/ocr/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          document: {
            type: 'image_url',
            image_url: imageUrl
          },
          include_image_base64: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Mistral OCR API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();

      // Extract text from Mistral OCR response
      const pages = data.pages || [];
      const markdownContent = pages.map((page: any) => page.markdown || '').join('\n');

      return {
        text: markdownContent,
        markdown: markdownContent,
        confidence: 95, // Mistral OCR typically has high confidence
        words: [] // Mistral OCR returns markdown, not word-level data
      };
    } catch (error) {
      console.error('Mistral OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Parse prescription text from OCR result
   */
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

  /**
   * Initialize is no longer needed for Mistral (no worker to create)
   * Kept for backward compatibility
   */
  async initialize(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('OCR service initialization failed: API key not configured');
    }
    // No initialization needed for Mistral API
  }

  /**
   * Terminate is no longer needed for Mistral (no worker to terminate)
   * Kept for backward compatibility
   */
  async terminate(): Promise<void> {
    // No cleanup needed for Mistral API
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