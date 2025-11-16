# DiagNote Backend Setup

## Overview
The backend provides REST API endpoints for case management, flashcard spaced repetition, and AI-powered SOAP note generation using Google Gemini.

## Prerequisites

1. **Neon PostgreSQL Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy your connection string

2. **Google Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
DATABASE_URL=postgresql://user:password@host/database
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Push Database Schema

Push the schema to your Neon database:

```bash
npm run db:push
```

This creates the `case_notes` and `flashcards` tables.

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Case Notes

- `GET /api/cases` - Get all case notes
- `GET /api/cases/count` - Get total count
- `GET /api/cases/:id` - Get single case
- `POST /api/cases` - Create new case
- `DELETE /api/cases/:id` - Delete case (cascades flashcards)

### Flashcards

- `GET /api/flashcards/due` - Get flashcards due for review
- `POST /api/flashcards` - Create flashcards (bulk)
- `PUT /api/flashcards/:id` - Update flashcard (SRS algorithm)
- `DELETE /api/flashcards/:id` - Delete flashcard

### AI Services (Google Gemini)

- `POST /api/ai/generate-soap` - Generate SOAP note from transcript
  ```json
  {
    "transcript": "Patient presentation..."
  }
  ```

- `POST /api/ai/generate-flashcards` - Generate learning flashcards
  ```json
  {
    "transcript": "...",
    "aiDraft": "...",
    "clinicianDiagnosis": "...",
    "clinicianPlan": "..."
  }
  ```

## Database Schema

### case_notes
- `id` (varchar, UUID primary key)
- `transcript` (text) - Raw encounter text
- `ai_draft` (text) - AI-generated SOAP note
- `clinician_diagnosis` (text) - Clinician's assessment
- `clinician_plan` (text) - Clinician's treatment plan
- `created_at` (timestamp) - Creation date

### flashcards
- `id` (varchar, UUID primary key)
- `case_note_id` (varchar) - Foreign key to case_notes
- `question` (text) - Flashcard question
- `answer` (text) - Flashcard answer
- `next_review` (timestamp) - Next review date
- `interval` (integer) - Days until next review
- `ease_factor` (integer) - SRS ease factor (stored as 2.5 = 250)

## Google Gemini Integration

The backend uses **Gemini 1.5 Flash** for:

1. **SOAP Note Generation** - Structured clinical documentation from encounter transcripts
2. **Flashcard Generation** - Intelligent learning cards based on clinical cases

### Features:
- Contextual medical knowledge
- Structured output formatting
- Clinical reasoning support
- Evidence-based recommendations

## Development

### Type Checking
```bash
npm run check
```

### Database Migrations
```bash
npm run db:push
```

### Build for Production
```bash
npm run build
npm start
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for database status
- Ensure IP is allowlisted (Neon allows all by default)

### Gemini API Errors
- Verify `GEMINI_API_KEY` is valid
- Check API quota at Google AI Studio
- Review error logs in console

### CORS Issues
- Frontend and backend run on same port (5000)
- No CORS configuration needed in development

## Next Steps

- [ ] Implement ElevenLabs speech-to-text integration
- [ ] Add user authentication
- [ ] Implement rate limiting
- [ ] Add API request logging
- [ ] Set up production deployment
