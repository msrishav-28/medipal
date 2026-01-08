import { Medication, IntakeRecord } from '@/types';
import { nlpService, Intent, ConflictWarning } from './nlpService';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    medications?: Medication[];
    intakeRecords?: IntakeRecord[];
    actions?: ChatAction[];
    confidence?: number;
  };
}

export interface ChatAction {
  type: 'take_medication' | 'skip_medication' | 'snooze_medication' | 'view_medication' | 'add_medication';
  medicationId?: string;
  label: string;
  data?: any;
}

export interface ChatContext {
  userId: string;
  medications: Medication[];
  recentIntakeRecords: IntakeRecord[];
  conversationHistory: ChatMessage[];
  userPreferences?: {
    language: string;
    timezone: string;
  };
}

export interface AIResponse {
  message: string;
  actions?: ChatAction[];
  medications?: Medication[];
  confidence: number;
  intent?: string;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export class AIService {
  private static instance: AIService;
  private apiKey: string | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'gemini-1.5-flash';
  private maxTokens = 500;
  private temperature = 0.7;

  private constructor() {
    // Get Gemini API key from environment variables
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Set Gemini API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Check if AI service is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey !== '';
  }

  /**
   * Generate AI response for medication-related queries
   */
  async generateResponse(
    userMessage: string,
    context: ChatContext
  ): Promise<AIResponse> {
    // First, use NLP service for intent recognition and entity extraction
    const intent = nlpService.recognizeIntent(userMessage, context.medications);
    
    // Check for medication conflicts if adding new medication
    let conflicts: ConflictWarning[] = [];
    if (intent.type === 'add_medication' && intent.parameters.medicationName) {
      conflicts = nlpService.checkMedicationConflicts(
        intent.parameters.medicationName,
        context.medications
      );
    }

    // If AI service is not configured, use NLP-based fallback
    if (!this.isConfigured()) {
      return this.getNLPBasedResponse(userMessage, context, intent, conflicts);
    }

    try {
      const systemPrompt = this.createSystemPrompt(context);
      const enhancedPrompt = this.enhancePromptWithNLP(systemPrompt, intent, conflicts);
      const contents = this.formatMessagesForGemini(userMessage, context, enhancedPrompt);
      
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: this.temperature,
              maxOutputTokens: this.maxTokens,
              topP: 0.95,
              topK: 40
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseGeminiResponse(data, context, intent, conflicts);
    } catch (error) {
      console.error('AI service error:', error);
      return this.getNLPBasedResponse(userMessage, context, intent, conflicts);
    }
  }

  /**
   * Create system prompt with medication context
   */
  private createSystemPrompt(context: ChatContext): string {
    const medicationList = context.medications
      .map(med => {
        const schedule = med.times?.join(', ') || `Every ${med.interval} hours`;
        return `- ${med.name}: ${med.dosage} (${schedule})`;
      })
      .join('\n');
      
    return `You are MediCare AI, a helpful assistant for medication management. You help elderly patients with their medication schedules, questions, and adherence.

Current patient medications:
${medicationList || 'No active medications'}

Guidelines:
- Be warm, supportive, and encouraging
- Use simple, clear language appropriate for elderly users
- Focus on medication safety and adherence
- Provide specific, actionable advice
- Ask clarifying questions when needed
- Celebrate medication adherence achievements
- Gently remind about missed doses without being judgmental
- Always prioritize safety - recommend consulting healthcare providers for medical advice

Capabilities:
- Answer questions about medications (purpose, side effects, interactions)
- Help track medication intake
- Provide reminders and encouragement
- Explain medication schedules
- Suggest when to contact healthcare providers

Remember: You are not a replacement for medical professionals. Always encourage users to consult their doctors for medical concerns.`;
  }

  /**
   * Format messages for Gemini API
   */
  private formatMessagesForGemini(
    userMessage: string,
    context: ChatContext,
    systemPrompt: string
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    
    // Add system prompt as first user message (Gemini doesn't have system role)
    contents.push({
      role: 'user',
      parts: [{ text: `System Instructions:\n${systemPrompt}\n\nPlease acknowledge and follow these instructions.` }]
    });
    
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand. I am MediCare AI, ready to help with medication management. How can I assist you today?' }]
    });
    
    // Add recent conversation history (last 5 messages)
    const recentHistory = context.conversationHistory.slice(-5);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.type === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    return contents;
  }

  /**
   * Enhance system prompt with NLP insights
   */
  private enhancePromptWithNLP(systemPrompt: string, intent: Intent, conflicts: ConflictWarning[]): string {
    let enhancedPrompt = systemPrompt;
    
    enhancedPrompt += `\n\nCurrent user intent: ${intent.type} (confidence: ${Math.round(intent.confidence * 100)}%)`;
    
    if (intent.entities.length > 0) {
      enhancedPrompt += `\nDetected entities: ${intent.entities.map(e => `${e.type}: ${e.value}`).join(', ')}`;
    }
    
    if (conflicts.length > 0) {
      enhancedPrompt += `\n\nIMPORTANT MEDICATION CONFLICTS DETECTED:`;
      for (const conflict of conflicts) {
        enhancedPrompt += `\n- ${conflict.severity.toUpperCase()}: ${conflict.message}`;
        enhancedPrompt += `\n  Recommendation: ${conflict.recommendation}`;
      }
    }
    
    return enhancedPrompt;
  }

  /**
   * Generate NLP-based response when AI service is not available
   */
  private getNLPBasedResponse(
    _userMessage: string,
    context: ChatContext,
    intent: Intent,
    conflicts: ConflictWarning[]
  ): AIResponse {
    const response = nlpService.generateContextualResponse(
      intent,
      context.medications
    );
    let actions: ChatAction[] = [];
    let medications: Medication[] = [];
    
    // Generate actions based on intent
    switch (intent.type) {
      case 'mark_taken':
        if (intent.parameters.medicationName) {
          const medication = this.findMedication(intent.parameters.medicationName, context.medications);
          if (medication) {
            medications.push(medication);
            actions.push({
              type: 'take_medication',
              medicationId: medication.id,
              label: `Mark ${medication.name} as taken`,
              data: { medication }
            });
          }
        }
        break;
        
      case 'check_status':
      case 'get_info':
        if (intent.parameters.medicationName) {
          const medication = this.findMedication(intent.parameters.medicationName, context.medications);
          if (medication) {
            medications.push(medication);
            actions.push({
              type: 'view_medication',
              medicationId: medication.id,
              label: `View ${medication.name} details`,
              data: { medication }
            });
          }
        }
        break;
        
      case 'add_medication':
        actions.push({
          type: 'add_medication',
          label: 'Add new medication',
          data: { 
            name: intent.parameters.medicationName,
            dosage: intent.parameters.dosage 
          }
        });
        break;
    }
    
    // Add conflict warnings to response
    let finalResponse = response;
    if (conflicts.length > 0) {
      finalResponse += '\n\n⚠️ IMPORTANT WARNINGS:\n';
      for (const conflict of conflicts) {
        finalResponse += `• ${conflict.message}\n`;
        finalResponse += `  ${conflict.recommendation}\n`;
      }
    }
    
    return {
      message: finalResponse,
      actions,
      medications,
      confidence: intent.confidence,
      intent: intent.type,
      entities: intent.entities.map(e => ({
        type: e.type,
        value: e.value,
        confidence: e.confidence
      }))
    };
  }

  /**
   * Parse Gemini API response
   */
  private parseGeminiResponse(
    data: any,
    context: ChatContext,
    detectedIntent?: Intent,
    conflicts?: ConflictWarning[]
  ): AIResponse {
    const candidate = data.candidates?.[0];
    const content = candidate?.content;
    let responseText = content?.parts?.[0]?.text || 'I apologize, but I could not generate a response. Please try again.';
    let actions: ChatAction[] = [];
    let medications: Medication[] = [];
    
    // Extract actions from intent if detected
    if (detectedIntent) {
      switch (detectedIntent.type) {
        case 'check_status':
        case 'get_info':
          if (detectedIntent.parameters.medicationName) {
            const medication = this.findMedication(detectedIntent.parameters.medicationName, context.medications);
            if (medication) {
              medications.push(medication);
              actions.push({
                type: 'view_medication',
                medicationId: medication.id,
                label: `View ${medication.name} details`,
                data: { medication }
              });
            }
          }
          break;
          
        case 'mark_taken':
          if (detectedIntent.parameters.medicationName) {
            const medication = this.findMedication(detectedIntent.parameters.medicationName, context.medications);
            if (medication) {
              medications.push(medication);
              actions.push({
                type: 'take_medication',
                medicationId: medication.id,
                label: `Mark ${medication.name} as taken`,
                data: { medication }
              });
            }
          }
          break;
      }
    }

    // Add conflict warnings to response if present
    if (conflicts && conflicts.length > 0) {
      responseText += '\n\n⚠️ IMPORTANT WARNINGS:\n';
      for (const conflict of conflicts) {
        responseText += `• ${conflict.message}\n`;
        responseText += `  ${conflict.recommendation}\n`;
      }
    }

    return {
      message: responseText,
      actions,
      medications,
      confidence: 0.9,
      intent: detectedIntent?.type || '',
      entities: detectedIntent?.entities.map(e => ({
        type: e.type,
        value: e.value,
        confidence: e.confidence
      })) || []
    };
  }

  /**
   * Find medication by name (fuzzy matching)
   */
  private findMedication(name: string, medications: Medication[]): Medication | undefined {
    const lowerName = name.toLowerCase();
    
    // Exact match first
    let found = medications.find(med => med.name.toLowerCase() === lowerName);
    
    // Partial match if no exact match
    if (!found) {
      found = medications.find(med => 
        med.name.toLowerCase().includes(lowerName) || 
        lowerName.includes(med.name.toLowerCase())
      );
    }
    
    return found;
  }

  /**
   * Generate quick suggestion buttons based on context
   */
  generateQuickSuggestions(context: ChatContext): string[] {
    const suggestions = [
      'What medications should I take now?',
      'Did I take my medicine today?',
      'When is my next dose?'
    ];
    
    // Add medication-specific suggestions
    const activeMeds = context.medications.filter(m => m.isActive);
    if (activeMeds.length > 0 && activeMeds[0]) {
      const firstMed = activeMeds[0];
      suggestions.push(`Tell me about ${firstMed.name}`);
    }

    return suggestions.slice(0, 4); // Return max 4 suggestions
  }

  /**
   * Update AI service configuration
   */
  updateConfiguration(config: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): void {
    if (config.model) this.model = config.model;
    if (config.maxTokens) this.maxTokens = config.maxTokens;
    if (config.temperature !== undefined) this.temperature = config.temperature;
  }

  /**
   * Parse medication from natural language input
   */
  parseMedicationFromText(text: string): any[] {
    return nlpService.parseMedicationFromText(text);
  }

  /**
   * Check for medication conflicts
   */
  checkMedicationConflicts(newMedication: string, existingMedications: Medication[]): ConflictWarning[] {
    return nlpService.checkMedicationConflicts(newMedication, existingMedications);
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      isConfigured: this.isConfigured()
    };
  }
}

export const aiService = AIService.getInstance();
