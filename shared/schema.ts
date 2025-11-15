import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// CaseNote represents a complete patient encounter with AI-generated and clinician-entered notes
export const caseNotes = pgTable("case_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transcript: text("transcript").notNull(),
  aiDraft: text("ai_draft").notNull(),
  clinicianDiagnosis: text("clinician_diagnosis").notNull(),
  clinicianPlan: text("clinician_plan").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCaseNoteSchema = createInsertSchema(caseNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertCaseNote = z.infer<typeof insertCaseNoteSchema>;
export type CaseNote = typeof caseNotes.$inferSelect;

// Flashcard for spaced repetition learning
export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNoteId: varchar("case_note_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  nextReview: timestamp("next_review").notNull(),
  interval: integer("interval").notNull().default(1), // days until next review
  easeFactor: integer("ease_factor").notNull().default(250), // stored as integer (2.5 = 250)
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
});

export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;

// Encounter represents an in-progress patient encounter before it becomes a case note
export const encounterSchema = z.object({
  audioBlob: z.instanceof(Blob).optional(),
  textInput: z.string().optional(),
  mode: z.enum(["voice", "text"]),
});

export type Encounter = z.infer<typeof encounterSchema>;

// SOAP Note structure for display and parsing
export const soapNoteSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
});

export type SOAPNote = z.infer<typeof soapNoteSchema>;
