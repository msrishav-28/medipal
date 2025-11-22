# Development Guide

## Development Environment Setup

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/msrishav-28/medipal.git
cd medipal

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

Required environment variables:

```env
# OpenAI API for conversational AI
VITE_OPENAI_API_KEY=your_openai_api_key

# Optional: For production deployment
VITE_API_URL=https://api.medipal.app
```

## Development Workflow

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Code Quality Tools

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- MedicationCard.test.tsx

# Generate coverage report
npm run test:coverage

# Run integration tests
npm run test:integration

# Open Vitest UI
npm run test:ui
```

## Project Architecture

### Directory Structure

```
src/
├── components/          # React components
│   ├── accessibility/   # Accessibility utilities and components
│   ├── caregiver/       # Caregiver-specific features
│   ├── dev/             # Development tools (not in production)
│   ├── history/         # Analytics and reporting
│   ├── layout/          # Layout components (navigation, etc.)
│   ├── medication/      # Medication management
│   ├── notification/    # Notifications and reminders
│   ├── pwa/             # PWA-specific components
│   ├── providers/       # React context providers
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── services/            # Business logic and API clients
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── test/                # Test utilities and setup
```

### Design Patterns

#### Component Architecture
- Functional components with hooks
- Composition over inheritance
- Container/Presentational pattern
- Custom hooks for reusable logic

#### State Management
- React Query for server state
- React Context for global UI state
- Local component state for UI-specific data
- Custom hooks for encapsulated state logic

#### Data Access
- Repository pattern for database operations
- Service layer for business logic
- Optimistic updates for better UX
- Error boundaries for fault tolerance

### Code Style Guidelines

#### TypeScript
- Use strict mode
- Explicit return types for functions
- Interface over type for object shapes
- Avoid `any` type

#### React
- Functional components only
- Named exports for components
- Props interface defined inline or separately
- Use `React.FC` type when appropriate

#### Naming Conventions
- PascalCase for components and types
- camelCase for functions and variables
- UPPER_CASE for constants
- kebab-case for file names

### Adding New Features

#### 1. Create Feature Branch

```bash
git checkout -b feature/new-feature-name
```

#### 2. Implement Feature

Follow the component structure:

```typescript
// components/feature/NewFeature.tsx
import { useState } from 'react';
import type { NewFeatureProps } from './types';

export function NewFeature({ prop1, prop2 }: NewFeatureProps) {
  // Component logic
  return (
    <div>
      {/* Component UI */}
    </div>
  );
}

// components/feature/types.ts
export interface NewFeatureProps {
  prop1: string;
  prop2: number;
}

// components/feature/index.ts
export { NewFeature } from './NewFeature';
export type { NewFeatureProps } from './types';
```

#### 3. Add Tests

```typescript
// components/feature/__tests__/NewFeature.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewFeature } from '../NewFeature';

describe('NewFeature', () => {
  it('should render correctly', () => {
    render(<NewFeature prop1="test" prop2={42} />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

#### 4. Update Documentation

Add feature documentation to relevant guides.

#### 5. Submit Pull Request

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature-name
```

## Database Development

### Schema Changes

Database migrations are handled automatically by Dexie. To add new tables or modify schema:

```typescript
// services/database.ts
import Dexie from 'dexie';

export class MediPalDatabase extends Dexie {
  constructor() {
    super('MediPalDB');
    
    this.version(2).stores({
      users: 'id, email, createdAt',
      medications: 'id, userId, name, createdAt',
      intakeRecords: 'id, medicationId, timestamp, [medicationId+timestamp]',
      // New table in version 2
      newTable: 'id, field1, field2'
    });
  }
}
```

### Repository Pattern

Create repositories for new tables:

```typescript
// services/newTableRepository.ts
import { db } from './database';
import type { NewTable } from '@/types';

export const newTableRepository = {
  async create(data: Omit<NewTable, 'id'>): Promise<NewTable> {
    const id = await db.newTable.add(data);
    return { ...data, id: id.toString() };
  },

  async findById(id: string): Promise<NewTable | undefined> {
    return db.newTable.get(id);
  },

  async update(id: string, data: Partial<NewTable>): Promise<void> {
    await db.newTable.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.newTable.delete(id);
  }
};
```

## API Integration

### Adding New API Endpoints

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

export const apiService = {
  async newEndpoint(params: any) {
    const response = await api.post('/endpoint', params);
    return response.data;
  }
};
```

### Error Handling

```typescript
try {
  const data = await apiService.newEndpoint(params);
  return data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.message || 'API request failed');
  }
  throw error;
}
```

## Performance Optimization

### Code Splitting

Use dynamic imports for heavy components:

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Memoization

Use React.memo for expensive components:

```typescript
import { memo } from 'react';

export const ExpensiveComponent = memo(function ExpensiveComponent(props) {
  // Component logic
});
```

### Bundle Analysis

```bash
npm run build
npm run analyze
```

## Debugging

### Development Tools

The application includes a development dashboard accessible in development mode:

1. Start development server: `npm run dev`
2. Look for floating chart icon in bottom-right corner
3. Click to open dashboard with:
   - Performance metrics
   - Accessibility audit
   - Browser compatibility info

### React DevTools

Install React DevTools browser extension for component inspection and profiling.

### Network Debugging

Monitor IndexedDB operations:
1. Open browser DevTools
2. Navigate to Application tab
3. Expand IndexedDB section
4. Select MediPalDB

### Service Worker Debugging

1. Open DevTools > Application > Service Workers
2. Check "Update on reload" for development
3. Use "Unregister" to reset Service Worker

## Common Issues

### Service Worker Not Updating

```bash
# Clear Service Worker cache
# In browser DevTools: Application > Service Workers > Unregister
# Then hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### IndexedDB Version Conflict

```bash
# Clear IndexedDB
# In browser DevTools: Application > IndexedDB > Right-click MediPalDB > Delete
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules .vite
npm install
npm run build
```

## Deployment

### Production Build

```bash
npm run build
```

Output will be in the `dist/` directory.

### Environment-Specific Builds

```bash
# Staging
VITE_API_URL=https://staging-api.medipal.app npm run build

# Production
VITE_API_URL=https://api.medipal.app npm run build
```

### Deployment Checklist

- [ ] Update version in package.json
- [ ] Run full test suite
- [ ] Generate and review coverage report
- [ ] Run production build locally
- [ ] Test PWA installation
- [ ] Verify Service Worker functionality
- [ ] Check browser console for errors
- [ ] Test on multiple devices
- [ ] Verify environment variables
- [ ] Update CHANGELOG.md

## Monitoring and Analytics

### Performance Monitoring

The application automatically tracks Web Vitals in production:

```typescript
// Metrics are logged to console in development
// In production, send to analytics service
import { reportPerformanceMetrics } from '@/utils/performance';

reportPerformanceMetrics((metrics) => {
  // Send to analytics service
  analytics.track('performance', metrics);
});
```

### Error Tracking

Implement error tracking service integration:

```typescript
// App.tsx
window.addEventListener('error', (event) => {
  // Send to error tracking service
  errorTracker.captureException(event.error);
});
```

## Resources

### Documentation
- React Documentation: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs
- Vite Guide: https://vitejs.dev/guide
- TailwindCSS: https://tailwindcss.com/docs

### Tools
- VS Code Extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Error Lens

### Testing Resources
- Vitest Documentation: https://vitest.dev
- Testing Library: https://testing-library.com
- React Testing Library: https://testing-library.com/react

## Getting Help

For questions or issues:
1. Check existing documentation
2. Search closed issues on GitHub
3. Open a new issue with detailed description
4. Include error messages and reproduction steps
