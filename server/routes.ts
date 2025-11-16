import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSOAPWithGemini, generateFlashcardsWithGemini } from "./ai-services";
import { insertCaseNoteSchema, insertFlashcardSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Case Notes Routes
  
  // Get all case notes
  app.get("/api/cases", async (_req, res) => {
    try {
      const cases = await storage.getCaseNotes();
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  });

  // Get case notes count
  app.get("/api/cases/count", async (_req, res) => {
    try {
      const count = await storage.getCaseNotesCount();
      res.json({ count });
    } catch (error) {
      console.error("Error counting cases:", error);
      res.status(500).json({ error: "Failed to count cases" });
    }
  });

  // Get single case note
  app.get("/api/cases/:id", async (req, res) => {
    try {
      const caseNote = await storage.getCaseNoteById(req.params.id);
      if (!caseNote) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(caseNote);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ error: "Failed to fetch case" });
    }
  });

  // Create new case note
  app.post("/api/cases", async (req, res) => {
    try {
      const validatedData = insertCaseNoteSchema.parse(req.body);
      const caseNote = await storage.createCaseNote(validatedData);
      res.status(201).json(caseNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid case data", details: error.errors });
      }
      console.error("Error creating case:", error);
      res.status(500).json({ error: "Failed to create case" });
    }
  });

  // Delete case note
  app.delete("/api/cases/:id", async (req, res) => {
    try {
      await storage.deleteCaseNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ error: "Failed to delete case" });
    }
  });

  // Flashcard Routes
  
  // Get due flashcards
  app.get("/api/flashcards/due", async (_req, res) => {
    try {
      const dueCards = await storage.getFlashcardsDue();
      res.json(dueCards);
    } catch (error) {
      console.error("Error fetching due flashcards:", error);
      res.status(500).json({ error: "Failed to fetch flashcards" });
    }
  });

  // Create flashcards (bulk)
  app.post("/api/flashcards", async (req, res) => {
    try {
      const flashcardsArray = z.array(insertFlashcardSchema).parse(req.body);
      const createdCards = await storage.createFlashcards(flashcardsArray);
      res.status(201).json(createdCards);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid flashcard data", details: error.errors });
      }
      console.error("Error creating flashcards:", error);
      res.status(500).json({ error: "Failed to create flashcards" });
    }
  });

  // Update flashcard (for SRS algorithm)
  app.put("/api/flashcards/:id", async (req, res) => {
    try {
      const updatedCard = await storage.updateFlashcard(req.params.id, req.body);
      if (!updatedCard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      res.json(updatedCard);
    } catch (error) {
      console.error("Error updating flashcard:", error);
      res.status(500).json({ error: "Failed to update flashcard" });
    }
  });

  // Delete flashcard
  app.delete("/api/flashcards/:id", async (req, res) => {
    try {
      await storage.deleteFlashcard(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      res.status(500).json({ error: "Failed to delete flashcard" });
    }
  });

  // AI Service Routes

  // Generate SOAP note with Google Gemini
  app.post("/api/ai/generate-soap", async (req, res) => {
    try {
      const { transcript } = req.body;
      
      if (!transcript || typeof transcript !== 'string') {
        return res.status(400).json({ error: "Transcript is required" });
      }

      const soapNote = await generateSOAPWithGemini(transcript);
      res.json({ soapNote });
    } catch (error) {
      console.error("Error generating SOAP note:", error);
      res.status(500).json({ error: "Failed to generate SOAP note" });
    }
  });

  // Generate flashcards with Google Gemini
  app.post("/api/ai/generate-flashcards", async (req, res) => {
    try {
      const { transcript, aiDraft, clinicianDiagnosis, clinicianPlan } = req.body;
      
      if (!transcript || !aiDraft || !clinicianDiagnosis || !clinicianPlan) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const flashcards = await generateFlashcardsWithGemini(
        transcript,
        aiDraft,
        clinicianDiagnosis,
        clinicianPlan
      );
      
      res.json({ flashcards });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      res.status(500).json({ error: "Failed to generate flashcards" });
    }
  });

  // Speech-to-text endpoint (ElevenLabs integration)
  app.post("/api/ai/transcribe", async (req, res) => {
    try {
      // For now, return mock response since ElevenLabs integration not specified
      // This can be implemented later when audio blob handling is needed
      res.status(501).json({ error: "Speech-to-text not yet implemented" });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
