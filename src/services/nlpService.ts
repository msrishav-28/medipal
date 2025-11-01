import { Medication } from '@/types';

export interface ParsedMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  times?: string[];
  instructions?: string;
  confidence: number;
}

export interface Intent {
  type: 'add_medication' | 'check_status' | 'get_info' | 'mark_taken' | 'skip_dose' | 'snooze' | 'general_question' | 'unknown';
  confidence: number;
  entities: Entity[];
  parameters: Record<string, any>;
}

export interface Entity {
  type: 'medication_name' | 'dosage' | 'frequency' | 'time' | 'date' | 'number' | 'instruction';
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface ConflictWarning {
  type: 'interaction' | 'timing' | 'dosage' | 'allergy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  medications: string[];
  recommendation: string;
}

export class NLPService {
  private static instance: NLPService;
  
  // Common medication patterns
  private medicationPatterns = [
    // Brand names and generic names
    /\b(metformin|glucophage)\b/i,
    /\b(lisinopril|prinivil|zestril)\b/i,
    /\b(atorvastatin|lipitor)\b/i,
    /\b(amlodipine|norvasc)\b/i,
    /\b(omeprazole|prilosec)\b/i,
    /\b(levothyroxine|synthroid)\b/i,
    /\b(simvastatin|zocor)\b/i,
    /\b(losartan|cozaar)\b/i,
    /\b(hydrochlorothiazide|hctz)\b/i,
    /\b(gabapentin|neurontin)\b/i,
    /\b(sertraline|zoloft)\b/i,
    /\b(trazodone|desyrel)\b/i,
    /\b(tramadol|ultram)\b/i,
    /\b(prednisone|deltasone)\b/i,
    /\b(furosemide|lasix)\b/i,
    /\b(warfarin|coumadin)\b/i,
    /\b(insulin|novolog|humalog)\b/i,
    /\b(aspirin|acetaminophen|tylenol|ibuprofen|advil)\b/i
  ];

  // Dosage patterns
  private dosagePatterns = [
    /\b(\d+(?:\.\d+)?)\s*(mg|milligrams?|g|grams?|mcg|micrograms?|iu|units?)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(ml|milliliters?|cc|tablespoons?|teaspoons?|tbsp|tsp)\b/i,
    /\b(\d+(?:\.\d+)?)\s*(tablets?|pills?|capsules?|drops?)\b/i
  ];

  // Frequency patterns
  private frequencyPatterns = [
    /\b(once|twice|three times?|four times?|1x|2x|3x|4x)\s*(daily|a day|per day)\b/i,
    /\bevery\s*(\d+)\s*(hours?|hrs?|minutes?|mins?)\b/i,
    /\b(morning|afternoon|evening|night|bedtime)\b/i,
    /\b(breakfast|lunch|dinner|meals?)\b/i,
    /\bas needed|prn\b/i
  ];

  // Time patterns
  private timePatterns = [
    /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
    /\b(\d{1,2})\s*(am|pm)\b/i,
    /\b(morning|afternoon|evening|night|bedtime)\b/i
  ];

  // Intent patterns
  private intentPatterns = {
    add_medication: [
      /\b(add|new|start|begin|take|prescribed)\b.*\b(medication|medicine|pill|drug)\b/i,
      /\b(doctor|prescribed|pharmacy)\b.*\b(gave|told|said)\b/i,
      /\bi\s*(need to|have to|should)\s*(take|start)\b/i
    ],
    check_status: [
      /\b(did i|have i)\s*(take|taken)\b/i,
      /\bstatus\b.*\b(medication|medicine|pill)\b/i,
      /\bcheck\b.*\b(taken|missed)\b/i,
      /\bwhen\s*(did|was)\s*i\s*(supposed to|meant to)\b/i
    ],
    get_info: [
      /\bwhat\s*(is|does|are)\b.*\b(for|used for|treat)\b/i,
      /\btell me about\b/i,
      /\bside effects?\b/i,
      /\binteractions?\b/i,
      /\binformation\b.*\babout\b/i
    ],
    mark_taken: [
      /\bi\s*(took|just took|have taken)\b/i,
      /\bmark\b.*\b(taken|as taken|done)\b/i,
      /\bconfirm\b.*\b(taken|dose)\b/i
    ],
    skip_dose: [
      /\bskip\b.*\b(dose|medication|pill)\b/i,
      /\bi\s*(can't|cannot|won't)\s*take\b/i,
      /\bmiss\b.*\b(dose|medication)\b/i
    ],
    snooze: [
      /\bremind me\s*(later|in)\b/i,
      /\bsnooze\b/i,
      /\bnot now\b/i,
      /\b(wait|delay)\b.*\b(minutes?|hours?)\b/i
    ]
  };

  // Known drug interactions (simplified)
  private drugInteractions: Record<string, string[]> = {
    'warfarin': ['aspirin', 'ibuprofen', 'acetaminophen'],
    'metformin': ['alcohol'],
    'lisinopril': ['potassium', 'nsaids'],
    'simvastatin': ['grapefruit'],
    'levothyroxine': ['calcium', 'iron', 'coffee']
  };

  private constructor() {}

  static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  /**
   * Parse medication information from natural language text
   */
  parseMedicationFromText(text: string): ParsedMedication[] {
    const medications: ParsedMedication[] = [];

    // Extract medication names
    const medicationNames = this.extractMedicationNames(text);
    
    for (const name of medicationNames) {
      const medication: ParsedMedication = {
        name,
        confidence: 0.8
      };

      // Extract dosage
      const dosage = this.extractDosage(text);
      if (dosage) {
        medication.dosage = dosage;
        medication.confidence += 0.1;
      }

      // Extract frequency
      const frequency = this.extractFrequency(text);
      if (frequency) {
        medication.frequency = frequency;
        medication.confidence += 0.05;
      }

      // Extract times
      const times = this.extractTimes(text);
      if (times.length > 0) {
        medication.times = times;
        medication.confidence += 0.05;
      }

      // Extract instructions
      const instructions = this.extractInstructions(text);
      if (instructions) {
        medication.instructions = instructions;
      }

      medications.push(medication);
    }

    return medications;
  }

  /**
   * Recognize intent from user input
   */
  recognizeIntent(text: string, userMedications: Medication[] = []): Intent {
    const lowerText = text.toLowerCase();
    const entities = this.extractEntities(text, userMedications);

    // Check each intent pattern
    for (const [intentType, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerText)) {
          return {
            type: intentType as Intent['type'],
            confidence: 0.8,
            entities,
            parameters: this.extractParameters(text, intentType, entities)
          };
        }
      }
    }

    // Default to general question if no specific intent found
    return {
      type: entities.some(e => e.type === 'medication_name') ? 'get_info' : 'general_question',
      confidence: 0.5,
      entities,
      parameters: {}
    };
  }

  /**
   * Check for medication conflicts
   */
  checkMedicationConflicts(
    newMedication: string,
    existingMedications: Medication[]
  ): ConflictWarning[] {
    const warnings: ConflictWarning[] = [];
    const newMedLower = newMedication.toLowerCase();

    // Check for known drug interactions
    for (const existing of existingMedications) {
      const existingLower = existing.name.toLowerCase();
      
      // Check if new medication interacts with existing ones
      const interactions = this.drugInteractions[newMedLower] || [];
      if (interactions.some((drug: string) => existingLower.includes(drug))) {
        warnings.push({
          type: 'interaction',
          severity: 'medium',
          message: `${newMedication} may interact with ${existing.name}`,
          medications: [newMedication, existing.name],
          recommendation: 'Consult your doctor or pharmacist about this potential interaction.'
        });
      }

      // Check reverse interactions
      const reverseInteractions = this.drugInteractions[existingLower] || [];
      if (reverseInteractions.some((drug: string) => newMedLower.includes(drug))) {
        warnings.push({
          type: 'interaction',
          severity: 'medium',
          message: `${existing.name} may interact with ${newMedication}`,
          medications: [existing.name, newMedication],
          recommendation: 'Consult your doctor or pharmacist about this potential interaction.'
        });
      }

      // Check for duplicate medications
      if (this.areSimilarMedications(newMedLower, existingLower)) {
        warnings.push({
          type: 'dosage',
          severity: 'high',
          message: `You may already be taking a similar medication: ${existing.name}`,
          medications: [newMedication, existing.name],
          recommendation: 'Check with your doctor to avoid taking duplicate medications.'
        });
      }
    }

    return warnings;
  }

  /**
   * Extract medication names from text
   */
  private extractMedicationNames(text: string): string[] {
    const names: string[] = [];
    
    for (const pattern of this.medicationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        names.push(matches[0]);
      }
    }

    // Also look for capitalized words that might be medication names
    const words = text.split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && /^[A-Z][a-z]+$/.test(word)) {
        // Could be a medication name
        names.push(word);
      }
    }

    return [...new Set(names)]; // Remove duplicates
  }

  /**
   * Extract dosage information
   */
  private extractDosage(text: string): string | null {
    for (const pattern of this.dosagePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  /**
   * Extract frequency information
   */
  private extractFrequency(text: string): string | null {
    for (const pattern of this.frequencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  /**
   * Extract time information
   */
  private extractTimes(text: string): string[] {
    const times: string[] = [];
    
    for (const pattern of this.timePatterns) {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        times.push(match[0]);
      }
    }

    return times;
  }

  /**
   * Extract instructions
   */
  private extractInstructions(text: string): string | null {
    const instructionKeywords = [
      'with food', 'without food', 'on empty stomach', 'before meals', 'after meals',
      'with water', 'do not crush', 'swallow whole', 'dissolve', 'chew'
    ];

    for (const keyword of instructionKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        return keyword;
      }
    }

    return null;
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string, userMedications: Medication[]): Entity[] {
    const entities: Entity[] = [];

    // Extract medication names from user's medication list
    for (const med of userMedications) {
      const regex = new RegExp(`\\b${med.name}\\b`, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        entities.push({
          type: 'medication_name',
          value: med.name,
          confidence: 0.9,
          start: match.index || 0,
          end: (match.index || 0) + match[0].length
        });
      }
    }

    // Extract dosages
    for (const pattern of this.dosagePatterns) {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        entities.push({
          type: 'dosage',
          value: match[0],
          confidence: 0.8,
          start: match.index || 0,
          end: (match.index || 0) + match[0].length
        });
      }
    }

    // Extract times
    for (const pattern of this.timePatterns) {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        entities.push({
          type: 'time',
          value: match[0],
          confidence: 0.8,
          start: match.index || 0,
          end: (match.index || 0) + match[0].length
        });
      }
    }

    return entities;
  }

  /**
   * Extract parameters based on intent and entities
   */
  private extractParameters(text: string, intentType: string, entities: Entity[]): Record<string, any> {
    const parameters: Record<string, any> = {};

    switch (intentType) {
      case 'add_medication':
        parameters.medicationName = entities.find(e => e.type === 'medication_name')?.value;
        parameters.dosage = entities.find(e => e.type === 'dosage')?.value;
        parameters.times = entities.filter(e => e.type === 'time').map(e => e.value);
        break;

      case 'check_status':
      case 'get_info':
      case 'mark_taken':
        parameters.medicationName = entities.find(e => e.type === 'medication_name')?.value;
        parameters.time = entities.find(e => e.type === 'time')?.value;
        break;

      case 'snooze':
        const numberMatch = text.match(/\b(\d+)\s*(minutes?|hours?)\b/i);
        if (numberMatch && numberMatch[1] && numberMatch[2]) {
          parameters.duration = parseInt(numberMatch[1]);
          parameters.unit = numberMatch[2].toLowerCase();
        }
        break;
    }

    return parameters;
  }

  /**
   * Check if two medication names are similar
   */
  private areSimilarMedications(name1: string, name2: string): boolean {
    // Simple similarity check - could be enhanced with more sophisticated algorithms
    const similarity = this.calculateSimilarity(name1, name2);
    return similarity > 0.8;
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) {
      if (matrix[0]) matrix[0][i] = i;
    }
    for (let j = 0; j <= len2; j++) {
      const row = matrix[j];
      if (row) row[0] = j;
    }

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        const row = matrix[j];
        const prevRow = matrix[j - 1];
        
        if (row && prevRow) {
          row[i] = Math.min(
            prevRow[i]! + 1,           // deletion
            row[i - 1]! + 1,           // insertion
            prevRow[i - 1]! + cost     // substitution
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    const finalRow = matrix[len2];
    const distance = finalRow ? finalRow[len1]! : 0;
    return (maxLen - distance) / maxLen;
  }

  /**
   * Generate contextual response based on user's medication data
   */
  generateContextualResponse(
    intent: Intent,
    userMedications: Medication[]
  ): string {
    const medicationName = intent.parameters.medicationName;
    
    switch (intent.type) {
      case 'check_status':
        if (medicationName) {
          const medication = userMedications.find(m => 
            m.name.toLowerCase().includes(medicationName.toLowerCase())
          );
          if (medication) {
            // Check if taken today (simplified)
            return `Let me check your ${medication.name} status. Based on your schedule, you should take ${medication.dosage} ${medication.times?.join(' and ') || 'as prescribed'}.`;
          }
        }
        return "I can help you check your medication status. Which medication are you asking about?";

      case 'get_info':
        if (medicationName) {
          const medication = userMedications.find(m => 
            m.name.toLowerCase().includes(medicationName.toLowerCase())
          );
          if (medication) {
            return `${medication.name} is prescribed as ${medication.dosage}. ${medication.instructions ? `Instructions: ${medication.instructions}` : ''} You should take it ${medication.times?.join(' and ') || 'as prescribed'}.`;
          }
        }
        return "I can provide information about your medications. Which one would you like to know about?";

      case 'mark_taken':
        if (medicationName) {
          return `Great! I'll mark your ${medicationName} as taken. Keep up the good work with your medication adherence!`;
        }
        return "Which medication did you take? I'll mark it as completed for you.";

      case 'add_medication':
        return "I can help you add a new medication. Please provide the medication name, dosage, and when you need to take it.";

      default:
        return "I'm here to help with your medications. You can ask me about your schedule, mark medications as taken, or get information about your prescriptions.";
    }
  }
}

export const nlpService = NLPService.getInstance();