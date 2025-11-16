import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateSOAPWithGemini(transcript: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert medical documentation assistant. Given the following patient encounter transcript, generate a comprehensive SOAP note (Subjective, Objective, Assessment, Plan) in a structured format.

ENCOUNTER TRANSCRIPT:
${transcript}

Please generate a detailed SOAP note following this structure:

SOAP Note:

S (Subjective):
[Patient's chief complaint, history of present illness, relevant past medical history, medications, allergies, social history as applicable]

O (Objective):
[Vital signs, physical examination findings, relevant labs or imaging if mentioned]

A (Assessment):
[Primary diagnosis, differential diagnoses, severity assessment]

P (Plan):
[Diagnostic workup, treatment recommendations, medications with dosing, follow-up instructions, return precautions]

Include ICD-10 codes and CPT codes at the end if applicable.

Generate the SOAP note now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error generating SOAP note with Gemini:", error);
    throw new Error("Failed to generate SOAP note");
  }
}

export async function generateFlashcardsWithGemini(
  transcript: string,
  aiDraft: string,
  clinicianDiagnosis: string,
  clinicianPlan: string
): Promise<Array<{ question: string; answer: string }>> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a medical education expert creating spaced repetition flashcards for clinical learning. Based on the following case information, generate 4-6 high-quality flashcards that test clinical reasoning, differential diagnosis, treatment planning, and key learning points.

ENCOUNTER TRANSCRIPT:
${transcript}

AI-GENERATED SOAP NOTE:
${aiDraft}

CLINICIAN'S DIAGNOSIS:
${clinicianDiagnosis}

CLINICIAN'S TREATMENT PLAN:
${clinicianPlan}

Generate flashcards that:
1. Test pattern recognition and differential diagnosis
2. Cover essential workup and diagnostic reasoning
3. Include treatment plans and medication details
4. Emphasize safety (return precautions, red flags)
5. Use clinical case format questions when appropriate

Format your response as a JSON array with this exact structure:
[
  {
    "question": "Clinical question here...",
    "answer": "Detailed answer with explanation..."
  }
]

Generate 4-6 flashcards now in valid JSON format:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const flashcards = JSON.parse(text);
    
    // Validate structure
    if (!Array.isArray(flashcards)) {
      throw new Error("Invalid flashcard format");
    }
    
    return flashcards.filter(card => 
      card.question && card.answer && 
      typeof card.question === 'string' && 
      typeof card.answer === 'string'
    );
  } catch (error) {
    console.error("Error generating flashcards with Gemini:", error);
    throw new Error("Failed to generate flashcards");
  }
}
