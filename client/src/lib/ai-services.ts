// API functions for AI services - connects to backend Google Gemini integration

export async function transcribeWithElevenLabs(audioBlob: Blob): Promise<string> {
  // Simulate API delay for now
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock transcription response - replace with actual API call when ElevenLabs is integrated
  return `Patient is a 45-year-old male presenting with chief complaint of chest pain for the past 3 days. Pain is described as sharp, located in the left chest area, worse with deep breathing and movement. Denies radiation to arm or jaw. No associated shortness of breath, nausea, or diaphoresis. Patient has a history of hypertension, currently on lisinopril 10mg daily. No recent trauma or injury. Pain started gradually and has been constant since onset. Patient rates pain as 6 out of 10 at rest, 8 out of 10 with movement.`;
}

export async function generateSOAPwithAzure(transcript: string): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-soap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate SOAP note');
    }

    const data = await response.json();
    return data.soapNote;
  } catch (error) {
    console.error('Error generating SOAP note:', error);
    throw error;
  }
}

export async function generateFlashcardsFromCase(
  transcript: string,
  aiDraft: string,
  clinicianDiagnosis: string,
  clinicianPlan: string
): Promise<Array<{ question: string; answer: string }>> {
  try {
    const response = await fetch('/api/ai/generate-flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        aiDraft,
        clinicianDiagnosis,
        clinicianPlan,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    return data.flashcards;
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
}
