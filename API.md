# API Documentation

## Overview

MediPal uses a combination of client-side services and external APIs to provide comprehensive medication management functionality.

## Service Architecture

### Client-Side Services

All business logic is encapsulated in service modules located in `src/services/`:

```
services/
├── aiService.ts              # AI chatbot integration
├── api.ts                    # API client configuration
├── caregiverService.ts       # Caregiver features
├── database.ts               # IndexedDB configuration
├── databaseService.ts        # Database operations
├── nlpService.ts             # Natural language processing
├── notificationService.ts    # Push notifications
├── notificationScheduler.ts  # Reminder scheduling
├── ocrService.ts             # OCR prescription scanning
├── offlineSyncService.ts     # Offline data synchronization
├── speechRecognitionService.ts # Voice input
├── voiceService.ts           # Text-to-speech
└── *Repository.ts            # Data access repositories
```

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
}
```

### Medication

```typescript
interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  form: MedicationForm;
  instructions: string;
  schedule: MedicationSchedule;
  startDate: Date;
  endDate?: Date;
  refillReminder?: number;
  pillsRemaining?: number;
  totalPills?: number;
  imageUrl?: string;
  prescriptionImageUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type MedicationForm = 
  | 'tablet' 
  | 'capsule' 
  | 'liquid' 
  | 'injection' 
  | 'inhaler' 
  | 'topical' 
  | 'other';

interface MedicationSchedule {
  type: 'time-based' | 'interval-based';
  times?: string[]; // For time-based (e.g., ["08:00", "20:00"])
  interval?: number; // For interval-based (hours)
  frequency?: string; // Human-readable (e.g., "2 times daily")
  withFood?: boolean;
  specialInstructions?: string;
}
```

### Intake Record

```typescript
interface IntakeRecord {
  id: string;
  medicationId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: IntakeStatus;
  skipReason?: string;
  snoozedUntil?: Date;
  notes?: string;
  createdAt: Date;
}

type IntakeStatus = 
  | 'scheduled' 
  | 'taken' 
  | 'missed' 
  | 'skipped' 
  | 'snoozed';
```

### Caregiver

```typescript
interface Caregiver {
  id: string;
  userId: string; // Patient's user ID
  name: string;
  email: string;
  phone?: string;
  accessCode: string;
  relationship: string;
  permissions: CaregiverPermissions;
  notificationPreferences: NotificationPreferences;
  active: boolean;
  createdAt: Date;
  lastAccessAt?: Date;
}

interface CaregiverPermissions {
  viewMedications: boolean;
  viewHistory: boolean;
  receiveAlerts: boolean;
  markEmergency: boolean;
  editMedications: boolean;
}

interface NotificationPreferences {
  missedDoseAlert: boolean;
  weeklyReport: boolean;
  emergencyOnly: boolean;
  channels: ('email' | 'sms' | 'push')[];
}
```

## Database API

### Medication Repository

```typescript
// Create medication
const medication = await medicationRepository.create({
  userId: currentUserId,
  name: 'Aspirin',
  dosage: '100mg',
  form: 'tablet',
  instructions: 'Take with water',
  schedule: {
    type: 'time-based',
    times: ['08:00', '20:00'],
    frequency: '2 times daily',
    withFood: false
  },
  startDate: new Date(),
  active: true
});

// Get medication by ID
const medication = await medicationRepository.findById(medicationId);

// Get all medications for user
const medications = await medicationRepository.findByUserId(userId);

// Get active medications
const activeMeds = await medicationRepository.findActiveByUserId(userId);

// Update medication
await medicationRepository.update(medicationId, {
  pillsRemaining: 20,
  active: true
});

// Delete medication
await medicationRepository.delete(medicationId);

// Search medications
const results = await medicationRepository.search(userId, 'aspirin');
```

### Intake Record Repository

```typescript
// Create intake record
const record = await intakeRepository.create({
  medicationId: medication.id,
  scheduledTime: new Date(),
  status: 'scheduled'
});

// Mark as taken
await intakeRepository.update(record.id, {
  status: 'taken',
  actualTime: new Date()
});

// Skip dose
await intakeRepository.update(record.id, {
  status: 'skipped',
  skipReason: 'Felt nauseous'
});

// Get records for medication
const records = await intakeRepository.findByMedicationId(medicationId);

// Get records by date range
const records = await intakeRepository.findByDateRange(
  medicationId,
  startDate,
  endDate
);

// Calculate adherence
const adherence = await intakeRepository.calculateAdherence(
  medicationId,
  startDate,
  endDate
);
```

### User Repository

```typescript
// Create user
const user = await userRepository.create({
  email: 'user@example.com',
  name: 'John Doe',
  timezone: 'America/New_York',
  preferences: {
    theme: 'system',
    fontSize: 'medium',
    highContrast: false,
    voiceEnabled: true,
    notificationsEnabled: true,
    language: 'en-US'
  }
});

// Get current user
const user = await userRepository.getCurrentUser();

// Update preferences
await userRepository.updatePreferences(userId, {
  theme: 'dark',
  fontSize: 'large'
});
```

### Caregiver Repository

```typescript
// Create caregiver
const caregiver = await caregiverRepository.create({
  userId: patientId,
  name: 'Jane Doe',
  email: 'jane@example.com',
  relationship: 'daughter',
  accessCode: generateAccessCode(),
  permissions: {
    viewMedications: true,
    viewHistory: true,
    receiveAlerts: true,
    markEmergency: true,
    editMedications: false
  },
  notificationPreferences: {
    missedDoseAlert: true,
    weeklyReport: true,
    emergencyOnly: false,
    channels: ['email', 'sms']
  },
  active: true
});

// Find by access code
const caregiver = await caregiverRepository.findByAccessCode(accessCode);

// Get caregivers for patient
const caregivers = await caregiverRepository.findByUserId(patientId);

// Update permissions
await caregiverRepository.updatePermissions(caregiverId, {
  editMedications: true
});
```

## External APIs

### OpenAI Integration

Used for conversational AI chatbot.

```typescript
// services/aiService.ts
import { AIService } from '@/services/aiService';

const aiService = new AIService(apiKey);

// Process user message
const response = await aiService.processMessage(
  userId,
  'What medications should I take with food?'
);

// Parse medication from natural language
const medication = await aiService.parseMedicationFromText(
  'I need to take 100mg of aspirin twice daily'
);

// Check for interactions
const conflicts = await aiService.checkMedicationConflicts(
  medications,
  newMedication
);
```

**Configuration:**

```env
VITE_OPENAI_API_KEY=sk-...
```

**Rate Limits:**
- Free tier: 3 requests/minute
- Paid tier: 60 requests/minute

### Tesseract.js (OCR)

Used for prescription scanning.

```typescript
// services/ocrService.ts
import { scanPrescription } from '@/services/ocrService';

// Scan prescription image
const result = await scanPrescription(imageFile);

// Result contains:
// - medications: Medication[]
// - rawText: string
// - confidence: number
```

**Supported Formats:**
- JPEG, PNG, WebP
- Maximum file size: 10MB
- Recommended resolution: 300+ DPI

## Web APIs

### Notifications API

```typescript
// Request permission
const permission = await Notification.requestPermission();

// Create notification
const notification = await notificationService.showNotification({
  title: 'Medication Reminder',
  body: 'Time to take Aspirin 100mg',
  icon: '/icons/pill.png',
  badge: '/icons/badge.png',
  tag: 'medication-reminder',
  requireInteraction: true,
  actions: [
    { action: 'taken', title: 'I took it' },
    { action: 'snooze', title: 'Snooze 15m' }
  ]
});
```

### Speech Recognition API

```typescript
// Start voice input
const recognition = new webkitSpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = false;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  console.log('User said:', transcript);
};

recognition.start();
```

### Speech Synthesis API

```typescript
// Text to speech
const utterance = new SpeechSynthesisUtterance(
  'Time to take your Aspirin'
);
utterance.lang = 'en-US';
utterance.rate = 1.0;
utterance.pitch = 1.0;

speechSynthesis.speak(utterance);
```

### IndexedDB

All data is stored locally using IndexedDB via Dexie.js:

```typescript
// Direct database access
import { db } from '@/services/database';

// Query with Dexie
const medications = await db.medications
  .where('userId').equals(userId)
  .and(med => med.active === true)
  .toArray();

// Compound indexes
const records = await db.intakeRecords
  .where('[medicationId+timestamp]')
  .between(
    [medicationId, startDate],
    [medicationId, endDate]
  )
  .toArray();
```

## Offline Sync

### Background Sync

```typescript
// Queue action for sync
await offlineSyncService.queueAction({
  type: 'create',
  entity: 'medication',
  data: medicationData
});

// Sync when online
await offlineSyncService.sync();

// Get pending count
const count = await offlineSyncService.getPendingCount();
```

### Conflict Resolution

```typescript
// Last-write-wins strategy
// Server timestamp determines the winning record
```

## Error Handling

All services use consistent error handling:

```typescript
try {
  const result = await service.method(params);
  return result;
} catch (error) {
  if (error instanceof DatabaseError) {
    // Handle database errors
    console.error('Database error:', error.message);
  } else if (error instanceof NetworkError) {
    // Handle network errors
    console.error('Network error:', error.message);
  } else {
    // Handle unknown errors
    console.error('Unknown error:', error);
  }
  throw error;
}
```

## Rate Limiting

### Client-Side Rate Limiting

```typescript
// OCR scanning: 10 requests per minute
// AI chat: Based on OpenAI tier
// Notifications: No limit (browser handles)
```

## Security

### Data Privacy
- All data stored locally in IndexedDB
- No data sent to external servers except OpenAI
- Caregiver access codes are hashed
- HTTPS required for Service Workers

### API Keys
- Store in environment variables
- Never commit to version control
- Rotate regularly
- Use separate keys for dev/prod

## Performance

### Caching Strategy
- Service Worker caches static assets
- IndexedDB for data persistence
- React Query for API response caching
- Optimistic updates for better UX

### Optimization Tips
- Use pagination for large datasets
- Implement virtual scrolling for lists
- Lazy load heavy components
- Debounce search inputs
- Index frequently queried fields

## Testing

### Mock Services

```typescript
// vitest.setup.ts
vi.mock('@/services/database', () => ({
  db: mockDatabase
}));

vi.mock('@/services/aiService', () => ({
  AIService: MockAIService
}));
```

### Test Data

```typescript
// test/fixtures.ts
export const mockMedication = {
  id: '1',
  userId: 'user-1',
  name: 'Test Medication',
  dosage: '100mg',
  form: 'tablet',
  schedule: {
    type: 'time-based',
    times: ['08:00'],
    frequency: 'Once daily'
  },
  active: true,
  createdAt: new Date()
};
```

## Versioning

API version: 1.0.0

Breaking changes will increment major version.
