import Dexie, { type EntityTable } from 'dexie';

interface CaseNote {
  id?: number;
  transcript: string;
  aiDraft: string;
  clinicianDiagnosis: string;
  clinicianPlan: string;
  createdAt: number;
}

interface Flashcard {
  id?: number;
  caseNoteId: number;
  question: string;
  answer: string;
  nextReview: number;
  interval: number;
  easeFactor: number;
}

const db = new Dexie('ClinicalNotesDB') as Dexie & {
  caseNotes: EntityTable<CaseNote, 'id'>;
  flashcards: EntityTable<Flashcard, 'id'>;
};

db.version(2).stores({
  caseNotes: '++id, createdAt',
  flashcards: '++id, caseNoteId, nextReview',
});

export type { CaseNote, Flashcard };
export { db };
