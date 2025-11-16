// Placeholder functions for ElevenLabs Speech-to-Text and Azure OpenAI

export async function transcribeWithElevenLabs(audioBlob: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", audioBlob, "recording.webm");
  // Optionally append language_code/model_id in future
  const res = await fetch("/api/stt/transcribe", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const errorPayload = await res.json().catch(() => ({ message: res.statusText }));
    const err: any = new Error(errorPayload.message || "Transcription failed");
    if (errorPayload.code) err.code = errorPayload.code;
    throw err;
  }
  const data = await res.json();
  return data.transcript || "";
}

export async function generateSOAPwithAzure(transcript: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock SOAP note generation
  return `SOAP Note:

S (Subjective):
Patient is a 45-year-old male presenting with chest pain x3 days. Pain is sharp in nature, localized to left chest wall, exacerbated by deep breathing and movement. No radiation. Denies SOB, nausea, or diaphoresis. No recent trauma. Pain constant since onset, 6/10 at rest, 8/10 with movement.

O (Objective):
Vitals: BP 140/85, HR 78, RR 16, Temp 98.6°F, SpO2 98% on room air
General: Alert, oriented, in no acute distress
Cardiovascular: Regular rate and rhythm, no murmurs, rubs, or gallops
Respiratory: Clear to auscultation bilaterally, no wheezes or crackles
Chest wall: Reproducible tenderness on palpation of left 4th-6th ribs at costochondral junction

A (Assessment):
1. Costochondritis - most likely diagnosis given reproducible chest wall tenderness, pleuritic nature of pain, and normal vital signs
2. Hypertension - currently controlled on current medication regimen
3. Need to rule out: Acute coronary syndrome (ACS), pulmonary embolism, pneumothorax

P (Plan):
1. Order ECG to rule out cardiac etiology
2. Order troponin levels (x2, 3 hours apart) to rule out myocardial injury
3. Consider chest X-ray if symptoms persist or worsen
4. NSAIDs: Ibuprofen 600mg PO TID with food for pain and inflammation
5. Rest and avoid strenuous activities
6. Follow up in 48-72 hours or sooner if symptoms worsen
7. Return precautions: chest pain increases, new SOB, syncope, or any concerning symptoms
8. Continue lisinopril as prescribed for hypertension

ICD-10: M94.0 (Costochondritis), I10 (Essential hypertension)
CPT: 99214 (Office visit, established patient, moderate complexity)`;
}

export async function generateFlashcardsFromCase(
  transcript: string,
  aiDraft: string,
  clinicianDiagnosis: string,
  clinicianPlan: string
): Promise<Array<{ question: string; answer: string }>> {
  const res = await fetch("/api/ai/generate-flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      aiDraft,
      clinicianDiagnosis,
      clinicianPlan,
    }),
  });

  if (!res.ok) {
    const errorPayload = await res.json().catch(() => ({ message: res.statusText }));
    const err: any = new Error(errorPayload.message || "Flashcard generation failed");
    if (errorPayload.code) err.code = errorPayload.code;
    throw err;
  }

  const data = await res.json();
  const raw = Array.isArray(data?.flashcards) ? data.flashcards : [];
  // Sanitize and validate
  const cleaned = raw
    .filter((c: any) => c && typeof c === "object")
    .map((c: any) => ({
      question: String(c.question ?? "").trim(),
      answer: String(c.answer ?? "").trim(),
    }))
    .filter((c: any) => c.question.length > 0 && c.answer.length > 0);

  return cleaned;
}

// Simple TTS helper: returns an object URL that can be used to play audio
export async function speakWithElevenLabs(text: string, opts?: { voiceId?: string; modelId?: string }): Promise<string> {
  const res = await fetch("/api/tts/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice_id: opts?.voiceId, model_id: opts?.modelId }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }));
    const e: any = new Error(payload.message || "TTS failed");
    e.code = payload.code;
    throw e;
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// Streaming TTS helper: returns audio chunks for immediate sequential playback
export async function speakWithElevenLabsStreaming(text: string): Promise<{ chunks: Array<{ index: number; audio: string; text: string }> }> {
  const response = await fetch('/api/tts/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`TTS streaming failed: ${response.status}`);
  }

  return response.json();
}

export async function listElevenLabsVoices(): Promise<any> {
  const res = await fetch("/api/tts/voices");
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }));
    const e: any = new Error(payload.message || "Failed to list voices");
    e.code = payload.code;
    throw e;
  }
  return res.json();
}
