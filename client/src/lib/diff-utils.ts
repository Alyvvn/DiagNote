export interface DiffResult {
  text1Parts: string[];
  text2Parts: string[];
  isDifferent: boolean[];
}

export function highlightDifferences(text1: string, text2: string): DiffResult {
  const words1 = text1.split(/(\s+)/);
  const words2 = text2.split(/(\s+)/);
  
  const maxLen = Math.max(words1.length, words2.length);
  const text1Parts: string[] = [];
  const text2Parts: string[] = [];
  const isDifferent: boolean[] = [];
  
  for (let i = 0; i < maxLen; i++) {
    const word1 = words1[i] || '';
    const word2 = words2[i] || '';
    
    text1Parts.push(word1);
    text2Parts.push(word2);
    isDifferent.push(word1 !== word2);
  }
  
  return { text1Parts, text2Parts, isDifferent };
}

export function extractSOAPSections(soapText: string): {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
} {
  const sections = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  };
  
  const sRegex = /S\s*\(Subjective\):?\s*([\s\S]*?)(?=\n\s*O\s*\(Objective\)|$)/i;
  const oRegex = /O\s*\(Objective\):?\s*([\s\S]*?)(?=\n\s*A\s*\(Assessment\)|$)/i;
  const aRegex = /A\s*\(Assessment\):?\s*([\s\S]*?)(?=\n\s*P\s*\(Plan\)|$)/i;
  const pRegex = /P\s*\(Plan\):?\s*([\s\S]*?)(?=$|ICD-10|CPT)/i;
  
  const sMatch = soapText.match(sRegex);
  const oMatch = soapText.match(oRegex);
  const aMatch = soapText.match(aRegex);
  const pMatch = soapText.match(pRegex);
  
  if (sMatch) sections.subjective = sMatch[1].trim();
  if (oMatch) sections.objective = oMatch[1].trim();
  if (aMatch) sections.assessment = aMatch[1].trim();
  if (pMatch) sections.plan = pMatch[1].trim();
  
  return sections;
}
