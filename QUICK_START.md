# Quick Start Guide

## 1. Get Your API Keys

### Neon PostgreSQL Database
1. Go to https://neon.tech
2. Sign up / Log in
3. Create a new project
4. Copy the connection string from the dashboard

### Google Gemini API
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the API key

## 2. Configure Environment

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
DATABASE_URL=postgresql://[YOUR_NEON_CONNECTION_STRING]
GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]
PORT=5000
NODE_ENV=development
```

## 3. Install and Setup

```bash
# Install dependencies
npm install

# Push database schema to Neon
npm run db:push

# Start development server
npm run dev
```

## 4. Verify Everything Works

Open http://localhost:5000

### Test SOAP Generation:
```bash
curl -X POST http://localhost:5000/api/ai/generate-soap \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Patient is a 45-year-old male with chest pain for 3 days. Sharp, left-sided, worse with breathing."}'
```

You should see a generated SOAP note response!

### Test Database:
```bash
# Get all cases (should be empty initially)
curl http://localhost:5000/api/cases
```

## 5. Use the App

1. Click "Voice Encounter" or "Text Encounter"
2. Enter/record patient details
3. Complete the recall checkpoint
4. Review AI-generated SOAP note
5. Generate flashcards
6. Study with spaced repetition!

## Troubleshooting

### "Cannot connect to database"
- Check your `DATABASE_URL` is correct
- Verify Neon project is active
- Try the connection string directly in a PostgreSQL client

### "Gemini API error"
- Verify `GEMINI_API_KEY` is correct
- Check you haven't exceeded free tier quota
- Visit https://aistudio.google.com to check API status

### "Port 5000 already in use"
- Change `PORT=5000` to another port in `.env`
- Or stop other services using port 5000

### Database schema issues
```bash
# Reset database (WARNING: deletes all data)
npm run db:push
```

## What's Next?

See `BACKEND_SETUP.md` for detailed documentation.
See `MIGRATION_GUIDE.md` to migrate from local storage.
See `IMPLEMENTATION_SUMMARY.md` for technical overview.

---

**Need Help?**
- Backend routes: `server/routes.ts`
- Database schema: `shared/schema.ts`
- AI integration: `server/ai-services.ts`
