# MediPal

A comprehensive Progressive Web Application for medication management, featuring voice-powered interfaces, AI assistance, and caregiver monitoring capabilities.

## Overview

MediPal is a modern, accessible medication management solution designed to help users track medications, receive timely reminders, and maintain medication adherence. The application supports multiple input methods including voice, manual entry, and OCR prescription scanning.

## Key Features

### Medication Management
- Voice-powered medication entry with natural language processing
- OCR prescription scanning using Mistral OCR API
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
- Google Gemini integration for intelligent responses
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
- React 18.2.0
- TypeScript 5.2.2
- Vite 5.0.8
- TailwindCSS 3.4.17
- Framer Motion 12.x
- React Query 5.90.5

### UI Design System
- Crystal Clear glassmorphism design
- Custom GlassCard and BentoGrid components
- Responsive layouts with DashboardLayout
- Modern sidebar and bottom navigation

### Data Management
- IndexedDB with Dexie 4.2.1
- Offline-first data synchronization
- Optimistic updates
- Data migration system

### AI and Voice
- Google Gemini API integration
- Web Speech API
- Mistral OCR for prescription scanning
- Natural Language Processing

### Testing
- Vitest 4.0.3
- React Testing Library
- Integration and unit tests

### PWA
- Workbox 7.3.0 via vite-plugin-pwa
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
│   │   ├── layout/            # Navigation, Sidebar, responsive components
│   │   ├── medication/        # Medication management UI
│   │   ├── notification/      # Reminder and notification UI
│   │   ├── pwa/               # PWA components
│   │   ├── providers/         # React context providers
│   │   └── ui/                # Reusable UI components (GlassCard, BentoGrid, etc.)
│   ├── hooks/                 # Custom React hooks
│   ├── layouts/               # Page layouts (DashboardLayout)
│   ├── lib/                   # Utility libraries
│   ├── pages/                 # Application pages
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── Medications.tsx    # Medication list
│   │   ├── Schedule.tsx       # Schedule view
│   │   ├── Reports.tsx        # Analytics and reports
│   │   ├── Chat.tsx           # AI chatbot
│   │   ├── Settings.tsx       # User settings
│   │   └── ...                # Other pages
│   ├── services/              # Business logic and API services
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── test/                  # Test configuration and utilities
│   ├── App.tsx                # Main application with routing
│   └── main.tsx               # Application entry point
├── public/
│   ├── manifest.webmanifest   # PWA manifest
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
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_MISTRAL_API_KEY=your_mistral_api_key
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
npm run lint:fix         # Fix lint errors
npm run format           # Format code with Prettier
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
- Bundle Size (gzipped): < 250KB

### Optimization Strategies
- Vendor chunk splitting
- Feature-based code splitting
- Image optimization
- Service Worker caching
- Database indexing
- Debounced search and filters

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

## License

MIT License - see LICENSE file for details

## Project Status

Current Version: 1.2.0
Last Updated: January 2026

### Recent Updates
- Google Gemini AI integration for chatbot
- Mistral OCR API for prescription scanning
- Caregiver email/SMS alerts via Vercel serverless
- Vercel deployment configuration
- ESLint and project cleanup

## Support

For issues, questions, or contributions, please contact the development team or open an issue on GitHub.

## Acknowledgments

Built with modern web technologies and best practices for accessibility, performance, and user experience.
