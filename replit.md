# Clinical Documentation & Learning Application

## Overview
A clinical documentation and learning platform for healthcare providers (doctors, therapists, residents) featuring voice/text encounter capture, AI-powered SOAP note generation, active recall workflows, and spaced repetition flashcards. Inspired by Vitruviana's polished medical aesthetic with a clean, professional interface.

## Project Status
**Status:** MVP Complete - All core features implemented with local-only storage (demo mode)
**Last Updated:** November 15, 2025

## Recent Changes (November 15, 2025)
- ✅ Fixed Dexie schema alignment: Changed IDs from string to number for type consistency
- ✅ Added loading states with skeleton components to Home, Cases, and Flashcards pages
- ✅ Implemented proper type safety across all database operations
- ✅ Created diff-utils for comparison highlighting functionality
- ✅ Updated database version to v2 to force IndexedDB reset
- ✅ Ensured easeFactor stored as decimal (2.5) for proper SRS calculations
- ✅ Added comprehensive data-testid attributes across interactive elements

## Core Features

### 1. Voice & Text Encounter Capture
- **Voice Mode:** Simulated recording interface with waveform animation (ElevenLabs STT placeholder)
- **Text Mode:** Direct text input for clinical encounters
- **Flow:** Capture → AI Processing → Recall Checkpoint

### 2. Active Recall Workflow
- Clinicians must enter their diagnosis/plan BEFORE seeing AI suggestions
- Prevents passive learning and anchoring bias
- Enforces active engagement with clinical reasoning

### 3. Side-by-Side Comparison
- Compare clinician assessment vs AI-generated SOAP note
- Identify learning gaps and reasoning differences
- Reflection prompts for self-assessment
- Save case + generate flashcards or save without flashcards

### 4. Spaced Repetition Flashcards
- Auto-generated flashcards from completed cases
- SM-2 algorithm implementation (Again/Good/Easy buttons)
- Tracks next review date, interval, and ease factor
- Shows due count on home dashboard

### 5. Past Cases Library
- Searchable archive of all completed cases
- View full encounter transcript, AI SOAP, clinician assessment
- Delete cases (cascades to associated flashcards)
- Date-sorted with preview cards

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query** for state management
- **Shadcn UI** components with Radix primitives
- **Tailwind CSS** with custom medical theme
- **Framer Motion** for animations
- **Lucide React** for icons

### Storage
- **Dexie.js** (IndexedDB wrapper) for local-only persistence
- No backend database (demo mode with local storage)
- Seed data automatically loaded on first visit

### AI Services (Placeholder Implementation)
- **Azure OpenAI** - SOAP note generation (mocked responses)
- **ElevenLabs** - Speech-to-text (mocked responses)
- Ready for user to connect real API keys later

## Data Models

### CaseNote
```typescript
interface CaseNote {
  id?: number;                    // Auto-increment
  transcript: string;             // Raw encounter text
  aiDraft: string;               // AI-generated SOAP note
  clinicianDiagnosis: string;    // Clinician's assessment
  clinicianPlan: string;         // Clinician's treatment plan
  createdAt: number;             // Unix timestamp
}
```

### Flashcard
```typescript
interface Flashcard {
  id?: number;                    // Auto-increment
  caseNoteId: number;            // Foreign key to CaseNote
  question: string;              // Flashcard front
  answer: string;                // Flashcard back
  nextReview: number;            // Unix timestamp
  interval: number;              // Days until next review
  easeFactor: number;            // SRS ease factor (stored as decimal: 2.5)
}
```

## Design System

### Colors (Medical Blue/Green Palette)
- **Primary:** Medical Blue (#0066CC family)
- **Accent:** Teal/Cyan (#00A8A8 family)
- **Semantic:** Professional grays for hierarchy
- **Success/Warning/Destructive:** Standard medical semantics

### Typography
- **Font:** Inter (clean, professional, highly legible)
- **Hierarchy:** Clear size/weight differentiation
- **Line Height:** Optimized for medical text readability

### Components
- All Shadcn components follow medical aesthetic
- Subtle hover states (hover-elevate utility)
- Smooth transitions and animations
- Consistent spacing and padding

## User Journeys

### Complete Case Workflow
1. **Home** → Choose Voice or Text encounter
2. **Encounter** → Record/type clinical encounter
3. **Processing** → AI generates SOAP note (background)
4. **Recall Checkpoint** → Enter diagnosis/plan without seeing AI
5. **Compare** → Review side-by-side comparison
6. **Save** → Generate flashcards or save case only
7. **Study** → Review flashcards with SRS scheduling

### Review Flashcards
1. **Home** → Click "Study Now" (shows due count)
2. **Flashcards** → See question, think, reveal answer
3. **Rate** → Again/Good/Easy (updates SRS schedule)
4. **Continue** → Next card until session complete

### Browse Past Cases
1. **Cases** → View all saved cases
2. **Search** → Filter by transcript/diagnosis/plan
3. **Select** → View full case details
4. **Delete** → Remove case and flashcards

## Architecture Decisions

### Local-Only Storage
- **Why:** Demo mode, no HIPAA compliance needed
- **Benefit:** Zero backend infrastructure, instant setup
- **Trade-off:** Data not synced across devices

### Placeholder AI Services
- **Why:** Allow development/demo without API costs
- **Implementation:** Realistic mocked responses based on input
- **Future:** Easy to swap for real Azure OpenAI / ElevenLabs

### Active Recall Pattern
- **Why:** Evidence-based learning methodology
- **Design:** Force diagnosis entry before AI reveal
- **Impact:** Prevents passive consumption, builds clinical reasoning

### Spaced Repetition (SM-2)
- **Algorithm:** SuperMemo 2 with interval calculation
- **Storage:** easeFactor as decimal (2.5), interval in days
- **Reviews:** Automatic scheduling based on performance

## Development Guidelines

### Adding New Features
1. Update data models in `shared/schema.ts` first
2. Update Dexie schema in `client/src/lib/db.ts`
3. Increment DB version to force migration
4. Add types for insert/select operations
5. Implement UI components following design_guidelines.md
6. Add data-testid attributes for testing
7. Include loading/error states

### Testing Approach
- Use playwright tests via run_test tool for E2E validation
- Test complete user journeys (encounter → flashcards)
- Verify dark mode on all pages
- Check responsive design (mobile/tablet/desktop)

### Code Style
- Follow existing patterns in codebase
- Use Shadcn components over custom UI
- Apply hover-elevate/active-elevate-2 for interactions
- Maintain type safety across all operations
- Add data-testid to interactive elements

## Known Limitations

1. **Local Storage Only:** No cloud sync, data lives in browser
2. **Placeholder AI:** Mock responses, not real Azure OpenAI/ElevenLabs
3. **No User Authentication:** Single-user local app
4. **No Export:** Cases/flashcards can't be exported (yet)

## Future Enhancements

### Phase 2 (When User Connects APIs)
- Real Azure OpenAI integration for SOAP generation
- Real ElevenLabs integration for speech-to-text
- Secret management for API keys
- Cost tracking and usage monitoring

### Phase 3 (Advanced Features)
- Enhanced diff highlighting in Compare view
- Flashcard analytics (success rates, retention curves)
- Case export to PDF/CSV
- Custom flashcard creation (not auto-generated)
- Tags and categories for cases
- Collaborative learning (share anonymized cases)

## File Organization

```
client/src/
├── pages/              # Route components
│   ├── home.tsx       # Dashboard
│   ├── encounter-voice.tsx
│   ├── encounter-text.tsx
│   ├── recall-checkpoint.tsx
│   ├── compare.tsx
│   ├── flashcards.tsx
│   └── cases.tsx
├── components/         # Reusable components
│   ├── ui/            # Shadcn components
│   └── theme-toggle.tsx
├── lib/               # Utilities
│   ├── db.ts          # Dexie database
│   ├── ai-services.ts # AI placeholders
│   ├── seed-data.ts   # Demo data
│   ├── diff-utils.ts  # Comparison utilities
│   └── queryClient.ts # TanStack Query config
└── index.css          # Global styles + design tokens

shared/
└── schema.ts          # Shared data types

server/
├── index.ts           # Express entry point
├── routes.ts          # API routes (empty for local-only)
└── storage.ts         # Storage interface (not used)
```

## User Preferences
- **Design:** Vitruviana-inspired medical aesthetic
- **Storage:** Local-only (no HIPAA compliance requirement)
- **AI:** Azure OpenAI + ElevenLabs (placeholder for now)
- **Learning:** Active recall + spaced repetition focus

## Project Goals
1. ✅ Create polished clinical documentation tool
2. ✅ Implement evidence-based learning workflows
3. ✅ Build completely local-only demo version
4. ⏳ Enable user to connect real API keys later
5. ⏳ Comprehensive E2E testing of all workflows
