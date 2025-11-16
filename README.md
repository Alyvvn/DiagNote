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
  
  Note: Voice mode now uses live ElevenLabs Speech-to-Text via server proxy.

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

### AI Services
- **Azure OpenAI** – SOAP note generation (still mocked; real integration pending)
- **ElevenLabs** – Speech-to-text now implemented via server proxy (`/api/stt/transcribe`). Client records `audio/webm` and uploads multipart form-data. Server forwards to ElevenLabs using model `scribe_v1`.

#### Speech-to-Text Integration (Phase 1)
| Aspect | Implementation |
|--------|----------------|
| Endpoint | `POST /api/stt/transcribe` (multipart `file`) |
| Model | `scribe_v1` (override via `ELEVENLABS_MODEL_ID`) |
| Auth | Server-side `ELEVENLABS_API_KEY` only (never exposed to client) |
| Logging | Disabled (`enable_logging=false`) to reduce retention |
| Rate Limit | 200 requests / hour / IP (override `STT_RATE_LIMIT_MAX`) |
| File Types | `audio/webm`, `audio/wav`, `audio/mpeg`, `audio/ogg` |
| Size Limit | 50 MB (typical encounter <5 MB) |
| Error Codes | `CONFIG`, `VALIDATION`, `RATE_LIMIT`, `UPSTREAM`, `UNKNOWN` |
| Mock Mode | Set `USE_MOCK_STT=1` when no key (deterministic transcript) |

#### Required Environment Variables (.env)
```
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_MODEL_ID=scribe_v1            # optional override
ELEVENLABS_STT_URL=https://api.elevenlabs.io/v1/speech-to-text  # optional
STT_RATE_LIMIT_MAX=200                   # optional per-IP hourly limit
USE_MOCK_STT=0                           # set to 1 ONLY for local dev without key
ELEVENLABS_VOICE_ID=                     # optional for TTS; if omitted we auto-pick first available
ELEVENLABS_TTS_MODEL_ID=eleven_multilingual_v2  # default TTS model
```

If `ELEVENLABS_API_KEY` is missing and `USE_MOCK_STT` is not `1`, the server returns `{ code: "CONFIG" }` and the UI shows a configuration toast.

#### Future (Phase 2)
Client-side AES-GCM encryption + RSA key wrapping (already scaffolded) and realtime streaming (`/api/stt/realtime`).

#### Text-to-Speech (TTS)
- Endpoint: `POST /api/tts/speak` (JSON: `{ text, voice_id?, model_id? }`) → returns `audio/mpeg`.
- Voices: `GET /api/tts/voices` to list available voices with your key.
- Defaults: Uses `ELEVENLABS_TTS_MODEL_ID` (default `eleven_multilingual_v2`). If `voice_id` not provided and `ELEVENLABS_VOICE_ID` unset, the server auto-selects the first available voice.

## Workflow Overview

- Voice Encounter (STT):
  - Record in `EncounterVoice` → upload audio (`audio/webm`) to `/api/stt/transcribe`.
  - Server forwards to ElevenLabs STT (`scribe_v1`) and returns `transcript`.
  - UI stores values in `sessionStorage`:
    - `encounterTranscript` (text)
    - `encounterAIDraft` (mocked SOAP draft for now)
    - `encounterMode` = `voice`
  - Navigate to Recall Checkpoint (requires clinician diagnosis/plan before reveal).

- Text Encounter:
  - Type/paste text in `EncounterText` → mocked SOAP draft.
  - Same `sessionStorage` keys as above; then Recall Checkpoint.

- Compare & Save:
  - `Compare` page shows clinician vs AI draft.
  - Save options:
    - Save Case Only → writes to IndexedDB (`db.caseNotes`).
    - Save & Generate Flashcards → writes case and auto-generates flashcards (`db.flashcards`).

- Past Cases & Flashcards:
  - `Cases` lists saved case notes from IndexedDB.
  - `Flashcards` schedules via SM‑2.

Data Persistence
- Local only via Dexie (IndexedDB): `client/src/lib/db.ts`.
- Case Note shape: `{ id, transcript, aiDraft, clinicianDiagnosis, clinicianPlan, createdAt }`.
- No server database in this MVP.

## Testing & QA

Prereqs
- Create `.env` with at least `ELEVENLABS_API_KEY`. The server auto-loads `.env` via dotenv.
- Optional: set `ELEVENLABS_VOICE_ID` for TTS or rely on auto-pick.

Run Dev
```
npm run dev
```

Manual Tests
- Voice → Transcript:
  - Navigate to Voice Encounter, record 5–10s, Generate SOAP Note.
  - Expect live transcript; SOAP remains mocked.
  - On missing key, UI shows configuration error (code `CONFIG`).

- Text Encounter:
  - Paste sample text, Generate SOAP Note → proceed to Recall Checkpoint.

- Recall Checkpoint:
  - Enter diagnosis and plan; click Reveal → navigates to Compare.

- Compare & Save:
  - Click Save Case Only → appears in Cases.
  - Click Save & Generate Flashcards → appears in Flashcards.

- TTS Quick Check:
  - Open devtools console:
    ```js
    import { speakWithElevenLabs } from '/src/lib/ai-services';
    const url = await speakWithElevenLabs('Hello from DiagNote.');
    new Audio(url).play();
    ```

API Endpoints (Server)
- `POST /api/stt/transcribe` → { transcript, words? }
- `POST /api/tts/speak` → audio/mpeg
- `GET /api/tts/voices` → list voices
- Error codes: `CONFIG`, `VALIDATION`, `RATE_LIMIT`, `UPSTREAM`, `UNKNOWN`

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
