# Migration Guide: Local Storage to Backend API

## Overview
This guide explains how to migrate the DiagNote frontend from using local IndexedDB (Dexie) storage to the backend PostgreSQL database with API calls.

## Current Architecture

### Before (Local-Only)
- **Storage**: Dexie.js (IndexedDB wrapper) - browser-based
- **AI Services**: Mocked responses in `client/src/lib/ai-services.ts`
- **Data Persistence**: Browser only (no sync across devices)

### After (Backend-Integrated)
- **Storage**: PostgreSQL via REST API
- **AI Services**: Google Gemini via backend API
- **Data Persistence**: Cloud database (syncs across devices)

## Migration Steps

### Step 1: Update Frontend to Use API Calls

The AI services are already updated to call the backend. Now we need to update the data storage calls.

#### Files to Modify:

1. **`client/src/pages/home.tsx`**
   - Replace Dexie queries with fetch API calls
   
   **Before:**
   ```typescript
   const count = await db.caseNotes.count();
   ```
   
   **After:**
   ```typescript
   const response = await fetch('/api/cases/count');
   const { count } = await response.json();
   ```

2. **`client/src/pages/cases.tsx`**
   - Replace Dexie queries with API calls
   
   **Before:**
   ```typescript
   const allCases = await db.caseNotes.orderBy('createdAt').reverse().toArray();
   ```
   
   **After:**
   ```typescript
   const response = await fetch('/api/cases');
   const allCases = await response.json();
   ```

3. **`client/src/pages/flashcards.tsx`**
   - Replace Dexie queries with API calls
   
   **Before:**
   ```typescript
   const cards = await db.flashcards.where('nextReview').below(now).toArray();
   ```
   
   **After:**
   ```typescript
   const response = await fetch('/api/flashcards/due');
   const cards = await response.json();
   ```

4. **`client/src/pages/compare.tsx`**
   - Replace Dexie inserts with API calls
   
   **Before:**
   ```typescript
   const caseId = await db.caseNotes.add({...});
   await db.flashcards.bulkAdd(flashcards);
   ```
   
   **After:**
   ```typescript
   const caseResponse = await fetch('/api/cases', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({...})
   });
   const { id: caseId } = await caseResponse.json();
   
   const flashcardsResponse = await fetch('/api/flashcards', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(flashcards)
   });
   ```

### Step 2: Update Data Types

The backend uses different types (UUID strings instead of auto-increment numbers).

**Update type conversions:**

- **Before**: `caseNoteId: number`
- **After**: `caseNoteId: string` (UUID)

### Step 3: Update Timestamps

The backend uses `Date` objects, not Unix timestamps.

**Before:**
```typescript
createdAt: Date.now(), // number (milliseconds)
nextReview: Date.now() + (interval * 24 * 60 * 60 * 1000)
```

**After:**
```typescript
// Backend handles these automatically with SQL defaults
// When updating flashcards:
nextReview: new Date(Date.now() + (interval * 24 * 60 * 60 * 1000))
```

### Step 4: Update Flashcard SRS Algorithm

The database stores `easeFactor` as an integer (250 = 2.5), but the schema now uses integer type.

**Backend Schema:**
```typescript
easeFactor: integer("ease_factor").notNull().default(250)
```

**When creating flashcards:**
```typescript
easeFactor: 250  // Store as integer in DB
// When using: easeFactor / 100 = 2.5
```

### Step 5: Remove Dexie Dependencies

Once migration is complete:

1. Remove Dexie imports from all pages
2. Delete `client/src/lib/db.ts`
3. Remove Dexie from package.json:
   ```bash
   npm uninstall dexie dexie-react-hooks
   ```

## Testing Migration

### 1. Set Up Environment
```bash
# Create .env file with your credentials
cp .env.example .env

# Push database schema
npm run db:push

# Start dev server
npm run dev
```

### 2. Test Each Feature

✅ **Home Page**
- [ ] Case count displays correctly
- [ ] Due flashcard count displays correctly

✅ **Voice/Text Encounter**
- [ ] Can record/type encounter
- [ ] AI generates SOAP note (via Gemini)

✅ **Recall Checkpoint**
- [ ] Can enter diagnosis and plan
- [ ] Data persists in sessionStorage

✅ **Compare View**
- [ ] Side-by-side comparison works
- [ ] Can save case to database
- [ ] Can generate flashcards (via Gemini)

✅ **Cases Page**
- [ ] All cases load from database
- [ ] Search/filter works
- [ ] Can view case details
- [ ] Can delete case (cascades flashcards)

✅ **Flashcards Page**
- [ ] Due cards load correctly
- [ ] Can flip cards
- [ ] SRS algorithm updates work (Again/Good/Easy)
- [ ] Progress saves to database

## API Response Formats

### Case Note
```json
{
  "id": "uuid-string",
  "transcript": "Patient presentation...",
  "aiDraft": "SOAP Note:\n\nS: ...",
  "clinicianDiagnosis": "Assessment...",
  "clinicianPlan": "Treatment plan...",
  "createdAt": "2025-11-15T10:30:00.000Z"
}
```

### Flashcard
```json
{
  "id": "uuid-string",
  "caseNoteId": "case-uuid",
  "question": "Clinical question...",
  "answer": "Detailed answer...",
  "nextReview": "2025-11-16T10:30:00.000Z",
  "interval": 1,
  "easeFactor": 250
}
```

## Rollback Plan

If you need to revert to local storage:

1. Keep Dexie installed
2. Restore `client/src/lib/db.ts`
3. Restore original Dexie queries in pages
4. Restore mocked AI services

## Common Issues

### CORS Errors
- Frontend and backend run on same port (5000)
- No CORS needed in development

### Database Connection
- Check `DATABASE_URL` in `.env`
- Verify Neon database is active
- Run `npm run db:push` to ensure schema is up to date

### Gemini API Errors
- Verify `GEMINI_API_KEY` is valid
- Check API quota at Google AI Studio
- Review console logs for specific errors

## Performance Considerations

### Local (Before)
- ✅ Instant read/write
- ❌ No sync across devices
- ❌ Limited to browser storage limits

### Backend (After)
- ✅ Data syncs across devices
- ✅ Unlimited storage (database)
- ⚠️ Network latency (usually <100ms)

### Optimization Tips
1. Use TanStack Query caching (already implemented)
2. Implement optimistic updates for better UX
3. Add loading skeletons (already implemented)
4. Consider pagination for large case lists

## Next Steps

1. ✅ Backend API implemented with Google Gemini
2. ⏳ Update frontend pages to use API calls
3. ⏳ Test complete user journey
4. ⏳ Deploy to production
5. ⏳ Add user authentication (optional)
