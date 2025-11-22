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
  private baseUrl = 'https://api.openai.com/v1';
  private model = 'gpt-3.5-turbo';
  private maxTokens = 500;
  private temperature = 0.7;

  private constructor() {
    // In a real app, this would come from environment variables or user settings
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Set OpenAI API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Check if AI service is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null;
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
      const messages = this.formatMessages(userMessage, context, enhancedPrompt);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          functions: this.getMedicationFunctions()
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data, context, intent, conflicts);
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
   * Format messages for OpenAI API
   */
  private formatMessages(
    userMessage: string,
    context: ChatContext,
    systemPrompt: string
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add recent conversation history (last 5 messages)
    const recentHistory = context.conversationHistory.slice(-5);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Define medication-related functions for OpenAI
   */
  private getMedicationFunctions() {
    return [
      {
        name: 'check_medication_status',
        description: 'Check if a medication was taken today or at a specific time',
        parameters: {
          type: 'object',
          properties: {
            medicationName: {
              type: 'string',
              description: 'Name of the medication to check'
            },
            timeframe: {
              type: 'string',
              enum: ['today', 'morning', 'afternoon', 'evening', 'specific_time'],
              description: 'Timeframe to check'
            }
          },
          required: ['medicationName']
        }
      },
      {
        name: 'get_medication_info',
        description: 'Get information about a specific medication',
        parameters: {
          type: 'object',
          properties: {
            medicationName: {
              type: 'string',
              description: 'Name of the medication'
            },
            infoType: {
              type: 'string',
              enum: ['purpose', 'side_effects', 'interactions', 'schedule', 'all'],
              description: 'Type of information requested'
            }
          },
          required: ['medicationName']
        }
      },
      {
        name: 'mark_medication_taken',
        description: 'Mark a medication as taken',
        parameters: {
          type: 'object',
          properties: {
            medicationName: {
              type: 'string',
              description: 'Name of the medication'
            },
            time: {
              type: 'string',
              description: 'Time when medication was taken (optional)'
            }
          },
          required: ['medicationName']
        }
      }
    ];
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
   * Parse AI response and extract actions
   */
  private parseAIResponse(data: any, context: ChatContext, detectedIntent?: Intent, conflicts?: ConflictWarning[]): AIResponse {
    const choice = data.choices?.[0];
    const message = choice?.message;
    let responseText = message?.content || 'I apologize, but I could not generate a response. Please try again.';
    let actions: ChatAction[] = [];
    let medications: Medication[] = [];
    let intentType = '';
    
    // Handle function calls
    if (message?.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments || '{}');
      intentType = functionName;
      
      switch (functionName) {
        case 'check_medication_status':
          const medication = this.findMedication(functionArgs.medicationName, context.medications);
          if (medication) {
            medications.push(medication);
            actions.push({
              type: 'view_medication',
              medicationId: medication.id,
              label: `View ${medication.name} details`,
              data: { medication }
            });
          }
          break;
          
        case 'get_medication_info':
          const med = this.findMedication(functionArgs.medicationName, context.medications);
          if (med) {
            medications.push(med);
            actions.push({
              type: 'view_medication',
              medicationId: med.id,
              label: `View ${med.name} information`,
              data: { medication: med }
            });
          }
          break;
          
        case 'mark_medication_taken':
          const takeMed = this.findMedication(functionArgs.medicationName, context.medications);
          if (takeMed) {
            medications.push(takeMed);
            actions.push({
              type: 'take_medication',
              medicationId: takeMed.id,
              label: `Mark ${takeMed.name} as taken`,
              data: { medication: takeMed }
            });
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
      intent: detectedIntent?.type || intentType || '',
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
