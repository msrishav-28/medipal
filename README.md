# MediPal

A comprehensive Progressive Web Application for medication management, featuring voice-powered interfaces, AI assistance, and caregiver monitoring capabilities.

## Overview

MediPal is a modern, accessible medication management solution designed to help users track medications, receive timely reminders, and maintain medication adherence. The application supports multiple input methods including voice, manual entry, and OCR prescription scanning.

## Key Features

### Medication Management
- Voice-powered medication entry with natural language processing
- OCR prescription scanning using Tesseract.js
- Multi-step medication wizard with validation
- Swipe gestures for quick actions on mobile
- Comprehensive medication database with conflict detection

### Reminder System
- Smart notification scheduling with Web APIs
- Voice reminders using Web Speech API
- Customizable snooze functionality
- Multiple reminder types (time-based, interval-based)
- Background notifications via Service Worker

### AI Assistant
- Conversational interface for medication queries
- OpenAI integration for intelligent responses
- Context-aware medication information
- Natural language medication parsing
- Quick suggestion buttons for common queries

### Caregiver Monitoring
- Secure access code generation and sharing
- Role-based access control
- Real-time adherence monitoring
- Automated alerts for missed doses
- Weekly adherence reports
- Emergency medication marking

### Analytics and Reporting
- Monthly calendar with color-coded adherence
- Adherence trend analysis and insights
- PDF report generation for healthcare providers
- Data export in multiple formats (CSV, JSON, PDF)
- Historical data visualization

### Progressive Web App
- Offline-first architecture
- Service Worker for background sync
- Installable on all platforms
- Responsive design (mobile, tablet, desktop)
- Background data synchronization

### Accessibility
- WCAG AA compliant
- Full keyboard navigation support
- Screen reader optimized
- High contrast mode
- Adjustable font sizes
- Touch-friendly interface (44x44px minimum targets)

## Technical Stack

### Frontend
- React 18.3.1
- TypeScript 5.6.2
- Vite 6.0.7
- TailwindCSS 3.4.17
- React Query 5.62.7

### Data Management
- IndexedDB with Dexie 4.0.10
- Offline-first data synchronization
- Optimistic updates
- Data migration system

### AI and Voice
- OpenAI API integration
- Web Speech API
- Tesseract.js for OCR
- Natural Language Processing

### Testing
- Vitest 4.0.3
- React Testing Library
- 34+ test suites
- Integration and unit tests

### PWA
- Workbox 7.3.0
- Service Worker caching
- Background sync
- Push notifications

## Project Structure

```
MediPal/
├── src/
│   ├── components/
│   │   ├── accessibility/     # Accessibility utilities
│   │   ├── caregiver/         # Caregiver dashboard and features
│   │   ├── dev/               # Development tools
│   │   ├── history/           # Analytics and reporting
│   │   ├── layout/            # Navigation and layout components
│   │   ├── medication/        # Medication management UI
│   │   ├── notification/      # Reminder and notification UI
│   │   ├── pwa/               # PWA components
│   │   ├── providers/         # React context providers
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # Business logic and API services
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── test/                  # Test configuration and utilities
│   ├── App.tsx                # Demo application
│   ├── MainApp.tsx            # Production application
│   └── main.tsx               # Application entry point
├── public/
│   ├── sw.js                  # Service Worker
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # Application icons
└── .kiro/specs/               # Project specifications
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/msrishav-28/medipal.git
cd medipal

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run tests in watch mode
npm run test:run         # Run all tests once
npm run test:ui          # Open Vitest UI
npm run test:integration # Run integration tests
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Lint code
npm run type-check       # Type check with TypeScript
npm run analyze          # Analyze bundle size
```

## Architecture

### Data Layer
- IndexedDB for local data persistence
- Repository pattern for data access
- Automatic data migration and versioning
- Optimistic updates for better UX

### State Management
- React Query for server state
- React Context for global state
- Custom hooks for encapsulated logic
- Local state for component-specific data

### Offline Support
- Service Worker with Workbox
- Background sync for delayed actions
- Offline queue management
- Automatic retry mechanism

### Performance Optimization
- Code splitting by route and feature
- Lazy loading for heavy components
- Bundle size optimization
- Web Vitals monitoring
- Asset caching strategies

## Browser Support

### Recommended Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Opera 76+

### Feature Requirements
- Service Workers
- IndexedDB
- Web Speech API (optional)
- MediaDevices API (for camera, optional)
- Push Notifications (optional)

## Accessibility

The application is designed to be accessible to all users:

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation throughout
- Focus management
- Screen reader announcements
- Color contrast compliance (WCAG AA)
- Touch target sizing (44x44px minimum)
- Reduced motion support

## Security

- No sensitive data stored in localStorage
- Encrypted IndexedDB (browser-level)
- Secure caregiver access codes
- HTTPS required for Service Workers
- Content Security Policy headers
- Input validation and sanitization

## Performance

### Target Metrics
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to First Byte (TTFB): < 800ms
- Bundle Size (gzipped): < 500KB

### Optimization Strategies
- Vendor chunk splitting
- Feature-based code splitting
- Image optimization
- Service Worker caching
- Database indexing
- Debounced search and filters

## Testing

### Test Coverage
- 34+ test suites
- Unit tests for services and utilities
- Component tests with React Testing Library
- Integration tests for user workflows
- Accessibility testing with automated audits
- Cross-browser compatibility testing

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- medication.test.tsx

# With coverage
npm run test:coverage

# Integration tests only
npm run test:integration
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Contributing

This project follows the Kiro Spec Workflow:

1. Requirements gathering (requirements.md)
2. Design documentation (design.md)
3. Task breakdown (tasks.md)
4. Systematic implementation
5. Testing and validation

## License

MIT License - see LICENSE file for details

## Project Status

Current Version: 1.0.0
Completion: 100% (All 11 tasks completed)

### Completed Tasks
1. Project Foundation
2. Design System and Responsive Layout
3. Data Layer and State Management
4. Medication Management
5. Reminder and Notification System
6. Intake Tracking and Confirmation
7. Conversational AI Interface
8. Caregiver Monitoring Features
9. History and Analytics Features
10. PWA Capabilities and Offline Functionality
11. Integration and Final Polish

## Support

For issues, questions, or contributions, please contact the development team or open an issue on GitHub.

## Acknowledgments

Built with modern web technologies and best practices for accessibility, performance, and user experience.
