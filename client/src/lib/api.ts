export interface CaseNoteDTO {
  id: string;
  transcript: string;
  aiDraft: string;
  clinicianDiagnosis: string;
  clinicianPlan: string;
  createdAt: string; // ISO string from server
}

export interface CreateCaseNoteInput {
  transcript: string;
  aiDraft: string;
  clinicianDiagnosis: string;
  clinicianPlan: string;
}

export interface FlashcardDTO {
  id: string;
  caseNoteId: string;
  question: string;
  answer: string;
  nextReview: string; // ISO string
  interval: number; // days
  easeFactor: number; // integer (e.g., 250 = 2.5)
}

export interface CreateFlashcardInput {
  caseNoteId: string;
  question: string;
  answer: string;
  nextReview: string; // ISO string
  interval: number;
  easeFactor: number; // integer
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Cases
export const api = {
  getCases: () => jsonFetch<CaseNoteDTO[]>(`/api/cases`),
  getCaseCount: () => jsonFetch<{ count: number }>(`/api/cases/count`).then(r => r.count),
  getCaseById: (id: string) => jsonFetch<CaseNoteDTO>(`/api/cases/${id}`),
  createCase: (data: CreateCaseNoteInput) => jsonFetch<CaseNoteDTO>(`/api/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteCase: (id: string) => fetch(`/api/cases/${id}`, { method: 'DELETE' }).then(res => {
    if (!res.ok) throw new Error('Failed to delete case');
  }),

  // Flashcards
  getDueFlashcards: () => jsonFetch<FlashcardDTO[]>(`/api/flashcards/due`),
  createFlashcards: (cards: CreateFlashcardInput[]) => jsonFetch<FlashcardDTO[]>(`/api/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cards),
  }),
  updateFlashcard: (id: string, data: Partial<FlashcardDTO>) => jsonFetch<FlashcardDTO>(`/api/flashcards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteFlashcard: (id: string) => fetch(`/api/flashcards/${id}`, { method: 'DELETE' }).then(res => {
    if (!res.ok) throw new Error('Failed to delete flashcard');
  }),
};
