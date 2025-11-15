export function highlightDifferences(text1: string, text2: string): {
  text1Highlighted: React.ReactNode[];
  text2Highlighted: React.ReactNode[];
} {
  const words1 = text1.split(/(\s+)/);
  const words2 = text2.split(/(\s+)/);
  
  const text1Highlighted: React.ReactNode[] = [];
  const text2Highlighted: React.ReactNode[] = [];
  
  const maxLen = Math.max(words1.length, words2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const word1 = words1[i] || '';
    const word2 = words2[i] || '';
    
    if (word1 === word2) {
      text1Highlighted.push(word1);
      text2Highlighted.push(word2);
    } else {
      if (word1) {
        text1Highlighted.push(
          <span key={`t1-${i}`} className="bg-destructive/20 text-destructive-foreground px-0.5 rounded">
            {word1}
          </span>
        );
      }
      if (word2) {
        text2Highlighted.push(
          <span key={`t2-${i}`} className="bg-primary/20 text-primary-foreground px-0.5 rounded">
            {word2}
          </span>
        );
      }
    }
  }
  
  return { text1Highlighted, text2Highlighted };
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
  
  const sRegex = /S\s*\(Subjective\):?\s*(.*?)(?=\n\s*O\s*\(Objective\)|$)/is;
  const oRegex = /O\s*\(Objective\):?\s*(.*?)(?=\n\s*A\s*\(Assessment\)|$)/is;
  const aRegex = /A\s*\(Assessment\):?\s*(.*?)(?=\n\s*P\s*\(Plan\)|$)/is;
  const pRegex = /P\s*\(Plan\):?\s*(.*?)(?=$|ICD-10|CPT)/is;
  
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
