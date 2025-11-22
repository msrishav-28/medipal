import { useState } from 'react';
import { nlpService, ParsedMedication, Intent, ConflictWarning } from '@/services/nlpService';
import { VoiceInput } from './VoiceInput';
import { Medication } from '@/types';
import { cn } from '@/utils/cn';
import Card from './Card';
import Button from './Button';

export function MedicationParsingDemo() {
  const [inputText, setInputText] = useState('');
  const [parsedMedications, setParsedMedications] = useState<ParsedMedication[]>([]);
  const [recognizedIntent, setRecognizedIntent] = useState<Intent | null>(null);
  const [conflicts, setConflicts] = useState<ConflictWarning[]>([]);
  const [contextualResponse, setContextualResponse] = useState<string>('');

  // Mock existing medications for conflict checking
  const mockMedications: Medication[] = [
    {
      id: '1',
      userId: 'demo',
      name: 'Warfarin',
      dosage: '5mg',
      form: 'tablet',
      scheduleType: 'time-based',
      times: ['18:00'],
      instructions: 'Take with food',
      startDate: new Date(),
      refillReminder: 7,
      totalPills: 30,
      remainingPills: 15,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      userId: 'demo',
      name: 'Metformin',
      dosage: '500mg',
      form: 'tablet',
      scheduleType: 'time-based',
      times: ['08:00', '20:00'],
      instructions: 'Take with meals',
      startDate: new Date(),
      refillReminder: 7,
      totalPills: 60,
      remainingPills: 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const handleAnalyze = () => {
    if (!inputText.trim()) return;

    // Parse medications from text
    const medications = nlpService.parseMedicationFromText(inputText);
    setParsedMedications(medications);

    // Recognize intent
    const intent = nlpService.recognizeIntent(inputText, mockMedications);
    setRecognizedIntent(intent);

    // Check for conflicts if adding new medication
    let detectedConflicts: ConflictWarning[] = [];
    if (intent.type === 'add_medication' && intent.parameters.medicationName) {
      detectedConflicts = nlpService.checkMedicationConflicts(
        intent.parameters.medicationName,
        mockMedications
      );
    }
    
    // Also check conflicts for parsed medications
    for (const med of medications) {
      const medConflicts = nlpService.checkMedicationConflicts(med.name, mockMedications);
      detectedConflicts.push(...medConflicts);
    }
    
    setConflicts(detectedConflicts);

    // Generate contextual response
    const response = nlpService.generateContextualResponse(intent, mockMedications);
    setContextualResponse(response);
  };

  const handleClear = () => {
    setInputText('');
    setParsedMedications([]);
    setRecognizedIntent(null);
    setConflicts([]);
    setContextualResponse('');
  };

  const exampleTexts = [
    "I need to take Aspirin 325mg twice daily with meals",
    "Did I take my Metformin this morning?",
    "What is Warfarin used for?",
    "I just took my evening medications",
    "Add Lisinopril 10mg once daily in the morning",
    "Skip my afternoon dose today"
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-neutral-700 bg-neutral-50 border-neutral-200';
    }
  };

  const getIntentColor = (intentType: string) => {
    switch (intentType) {
      case 'add_medication': return 'bg-green-100 text-green-800';
      case 'check_status': return 'bg-blue-100 text-blue-800';
      case 'get_info': return 'bg-purple-100 text-purple-800';
      case 'mark_taken': return 'bg-emerald-100 text-emerald-800';
      case 'skip_dose': return 'bg-orange-100 text-orange-800';
      case 'snooze': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-h2 mb-4">Natural Language Processing Demo</h2>
        <p className="text-neutral-600 mb-6">
          Test the medication parsing and intent recognition capabilities. Try voice input or type examples below.
        </p>

        {/* Input Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Enter medication-related text or use voice input
          </label>
          <VoiceInput
            value={inputText}
            onChange={setInputText}
            placeholder="Try: 'I need to take Aspirin 325mg twice daily' or 'Did I take my morning pills?'"
            showTranscript={true}
            autoSubmitOnSpeech={false}
            className="mb-4"
          />
          
          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={!inputText.trim()}>
              Analyze Text
            </Button>
            <Button variant="secondary" onClick={handleClear}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Example Texts */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Try these examples:</h3>
          <div className="flex flex-wrap gap-2">
            {exampleTexts.map((example, index) => (
              <Button
                key={index}
                size="sm"
                variant="secondary"
                onClick={() => setInputText(example)}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Results */}
      {(recognizedIntent || parsedMedications.length > 0 || conflicts.length > 0) && (
        <div className="space-y-4">
          {/* Intent Recognition */}
          {recognizedIntent && (
            <Card className="p-6">
              <h3 className="text-h3 mb-4">Intent Recognition</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      getIntentColor(recognizedIntent.type)
                    )}
                  >
                    {recognizedIntent.type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-neutral-600">
                    Confidence: {Math.round(recognizedIntent.confidence * 100)}%
                  </span>
                </div>

                {recognizedIntent.entities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Extracted Entities:</h4>
                    <div className="space-y-1">
                      {recognizedIntent.entities.map((entity, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700 font-mono">
                            {entity.type}
                          </span>
                          <span className="text-neutral-800">{entity.value}</span>
                          <span className="text-neutral-500">
                            ({Math.round(entity.confidence * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(recognizedIntent.parameters).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Parameters:</h4>
                    <div className="bg-neutral-50 rounded p-3 text-sm font-mono">
                      {JSON.stringify(recognizedIntent.parameters, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Parsed Medications */}
          {parsedMedications.length > 0 && (
            <Card className="p-6">
              <h3 className="text-h3 mb-4">Parsed Medications</h3>
              <div className="space-y-3">
                {parsedMedications.map((med, index) => (
                  <div key={index} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-neutral-800">{med.name}</h4>
                      <span className="text-sm text-neutral-600">
                        Confidence: {Math.round(med.confidence * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {med.dosage && (
                        <div>
                          <span className="text-neutral-600">Dosage:</span>
                          <span className="ml-2 text-neutral-800">{med.dosage}</span>
                        </div>
                      )}
                      {med.frequency && (
                        <div>
                          <span className="text-neutral-600">Frequency:</span>
                          <span className="ml-2 text-neutral-800">{med.frequency}</span>
                        </div>
                      )}
                      {med.times && med.times.length > 0 && (
                        <div>
                          <span className="text-neutral-600">Times:</span>
                          <span className="ml-2 text-neutral-800">{med.times.join(', ')}</span>
                        </div>
                      )}
                      {med.instructions && (
                        <div>
                          <span className="text-neutral-600">Instructions:</span>
                          <span className="ml-2 text-neutral-800">{med.instructions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Conflict Warnings */}
          {conflicts.length > 0 && (
            <Card className="p-6">
              <h3 className="text-h3 mb-4">⚠️ Medication Conflicts Detected</h3>
              <div className="space-y-3">
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className={cn(
                      'border rounded-lg p-4',
                      getSeverityColor(conflict.severity)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {conflict.severity === 'critical' && (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {conflict.severity === 'high' && (
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {conflict.severity === 'medium' && (
                          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{conflict.type}</span>
                          <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded uppercase font-medium">
                            {conflict.severity}
                          </span>
                        </div>
                        <p className="mb-2">{conflict.message}</p>
                        <p className="text-sm font-medium">
                          Recommendation: {conflict.recommendation}
                        </p>
                        <div className="mt-2 text-xs">
                          Medications involved: {conflict.medications.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Contextual Response */}
          {contextualResponse && (
            <Card className="p-6">
              <h3 className="text-h3 mb-4">AI Response</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">{contextualResponse}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Current Medications Context */}
      <Card className="p-6 bg-neutral-50">
        <h3 className="text-h3 mb-4">Current Medications (for conflict checking)</h3>
        <div className="space-y-2">
          {mockMedications.map((med) => (
            <div key={med.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{med.name}</span>
              <span className="text-neutral-600">{med.dosage} - {med.times?.join(', ')}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}