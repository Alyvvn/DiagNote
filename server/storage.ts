import { type InsertCaseNote, type CaseNote, type InsertFlashcard, type Flashcard } from "@shared/schema";
import { db } from "./db";
import { caseNotes, flashcards } from "@shared/schema";
import { eq, lt, desc } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // Case Notes
  createCaseNote(caseNote: InsertCaseNote): Promise<CaseNote>;
  getCaseNotes(): Promise<CaseNote[]>;
  getCaseNoteById(id: string): Promise<CaseNote | undefined>;
  deleteCaseNote(id: string): Promise<void>;
  getCaseNotesCount(): Promise<number>;

  // Flashcards
  createFlashcards(flashcardData: InsertFlashcard[]): Promise<Flashcard[]>;
  getFlashcardsDue(): Promise<Flashcard[]>;
  updateFlashcard(id: string, data: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<void>;
  deleteFlashcardsByCaseId(caseNoteId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Case Notes
  async createCaseNote(caseNote: InsertCaseNote): Promise<CaseNote> {
    const [result] = await db.insert(caseNotes).values(caseNote).returning();
    return result;
  }

  async getCaseNotes(): Promise<CaseNote[]> {
    return db.select().from(caseNotes).orderBy(desc(caseNotes.createdAt));
  }

  async getCaseNoteById(id: string): Promise<CaseNote | undefined> {
    const [result] = await db.select().from(caseNotes).where(eq(caseNotes.id, id));
    return result;
  }

  async deleteCaseNote(id: string): Promise<void> {
    // Delete associated flashcards first
    await this.deleteFlashcardsByCaseId(id);
    // Then delete the case note
    await db.delete(caseNotes).where(eq(caseNotes.id, id));
  }

  async getCaseNotesCount(): Promise<number> {
    const result = await db.select().from(caseNotes);
    return result.length;
  }

  // Flashcards
  async createFlashcards(flashcardData: InsertFlashcard[]): Promise<Flashcard[]> {
    if (flashcardData.length === 0) return [];
    const results = await db.insert(flashcards).values(flashcardData).returning();
    return results;
  }

  async getFlashcardsDue(): Promise<Flashcard[]> {
    const now = new Date();
    return db.select().from(flashcards).where(lt(flashcards.nextReview, now));
  }

  async updateFlashcard(id: string, data: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const [result] = await db
      .update(flashcards)
      .set(data)
      .where(eq(flashcards.id, id))
      .returning();
    return result;
  }

  async deleteFlashcard(id: string): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  async deleteFlashcardsByCaseId(caseNoteId: string): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.caseNoteId, caseNoteId));
  }
}

export const storage = new DatabaseStorage();
