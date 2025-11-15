import { db } from './db';

export async function seedDemoData() {
  const caseCount = await db.caseNotes.count();
  
  if (caseCount > 0) {
    return;
  }

  const demoCase1 = await db.caseNotes.add({
    transcript: `Patient is a 32-year-old female presenting with right lower quadrant abdominal pain for approximately 8 hours. Pain started periumbilically and migrated to the right lower quadrant. Associated with nausea and one episode of vomiting. Denies diarrhea or constipation. Reports fever at home (100.8°F). Last menstrual period was 2 weeks ago. No urinary symptoms. No known allergies. No significant past medical history.

On exam: Temperature 101.2°F, BP 118/72, HR 92, RR 16. Abdomen is soft with focal tenderness and guarding in right lower quadrant. Positive McBurney's point tenderness. Positive Rovsing's sign. No rebound tenderness. Bowel sounds present.`,
    aiDraft: `SOAP Note:

S (Subjective):
32-year-old female with 8 hours of right lower quadrant (RLQ) abdominal pain. Pain initially periumbilical, migrated to RLQ. Associated with nausea and one episode of vomiting. Denies diarrhea, constipation, or urinary symptoms. Fever 100.8°F at home. LMP 2 weeks ago. No significant PMH.

O (Objective):
Vitals: T 101.2°F, BP 118/72, HR 92, RR 16
Abdomen: Soft, focal RLQ tenderness with guarding, positive McBurney's point tenderness, positive Rovsing's sign, no rebound. Bowel sounds present.

A (Assessment):
1. Acute appendicitis - highly suspicious given classic presentation with periumbilical pain migrating to RLQ, fever, positive McBurney's and Rovsing's signs
2. Rule out: ruptured ovarian cyst, ectopic pregnancy (though LMP makes this less likely), PID, mesenteric adenitis

P (Plan):
1. Stat CBC with differential, CMP, lipase
2. Urine pregnancy test (mandatory before imaging)
3. CT abdomen/pelvis with IV contrast (if pregnancy test negative)
4. Surgical consultation for likely appendectomy
5. NPO status, establish IV access
6. IV fluids: Normal saline at 125 mL/hr
7. Pain control: Consider morphine or fentanyl IV
8. Antibiotic prophylaxis if surgery planned
9. Serial abdominal exams
10. Inform patient and family of likely surgical intervention

ICD-10: K35.80 (Unspecified acute appendicitis)
CPT: 99284 (Emergency department visit, high complexity)`,
    clinicianDiagnosis: `1. Acute appendicitis - classic presentation with migration of pain, fever, and positive clinical signs
2. Need to rule out gynecologic causes given patient age and gender`,
    clinicianPlan: `1. CBC, BMP, pregnancy test
2. CT scan if pregnancy negative
3. Surgical consult
4. IV fluids and pain management
5. Keep NPO`,
    createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
  });

  const demoCase2 = await db.caseNotes.add({
    transcript: `Patient is a 68-year-old male with history of Type 2 diabetes and hypertension presenting with progressive shortness of breath over the past week. Reports orthopnea (sleeps on 3 pillows) and paroxysmal nocturnal dyspnea. Bilateral lower extremity swelling for past 3 days. Denies chest pain. Medications include metformin, lisinopril, and aspirin (compliance described as "pretty good").

Physical exam: BP 168/96, HR 104 irregular, RR 22, SpO2 91% on room air. JVP elevated at 12 cm. Bibasilar crackles on lung auscultation. Cardiac exam reveals irregular rhythm, S3 gallop present. 2+ pitting edema bilateral lower extremities to mid-calf. No cyanosis.`,
    aiDraft: `SOAP Note:

S (Subjective):
68-year-old male with PMH of T2DM and HTN presenting with progressive dyspnea x1 week. Orthopnea (3 pillow), PND, bilateral LE edema x3 days. Denies chest pain. Medications: metformin, lisinopril, aspirin with fair compliance.

O (Objective):
Vitals: BP 168/96, HR 104 irregular, RR 22, SpO2 91% RA
General: Mild respiratory distress
HEENT: JVP elevated 12 cm
Lungs: Bibasilar crackles
Cardiac: Irregularly irregular rhythm, S3 gallop present
Extremities: 2+ pitting edema bilateral LE to mid-calf, no cyanosis

A (Assessment):
1. Acute decompensated heart failure (likely systolic dysfunction) - new onset or exacerbation
2. Atrial fibrillation with rapid ventricular response
3. Hypertensive urgency
4. Type 2 diabetes mellitus (uncontrolled based on poor compliance)
5. Volume overload

P (Plan):
1. Diagnostics:
   - ECG (confirm AFib, assess for ischemia)
   - Chest X-ray (assess for pulmonary edema, cardiomegaly)
   - BNP or NT-proBNP
   - CBC, CMP, troponin
   - TSH (can contribute to AFib)
   - Echocardiogram (assess EF, valve function)

2. Immediate management:
   - Supplemental O2 to maintain SpO2 >92%
   - IV furosemide 40mg (if no prior diuretic use) or double home dose if on chronic therapy
   - Strict I&O monitoring, daily weights
   - Fluid restriction <2L/day, low sodium diet (<2g/day)

3. Rate control for AFib:
   - Metoprolol 25mg PO BID or IV if hemodynamically stable
   - Consider diltiazem if beta-blocker contraindicated

4. Blood pressure management:
   - Continue lisinopril, may need uptitration after diuresis
   
5. Anticoagulation discussion after stabilization (CHA2DS2-VASc score assessment)

6. Cardiology consultation

7. Admit to telemetry unit for monitoring

ICD-10: I50.9 (Heart failure, unspecified), I48.91 (Atrial fibrillation), I10 (Essential hypertension), E11.9 (Type 2 diabetes)
CPT: 99285 (Emergency department visit, high severity)`,
    clinicianDiagnosis: `1. Acute heart failure exacerbation - likely due to medication non-compliance and uncontrolled hypertension
2. Atrial fibrillation - new onset vs. previously undiagnosed
3. Hypertensive emergency`,
    clinicianPlan: `1. Diuresis with IV Lasix
2. Rate control for AFib
3. ECG, BNP, troponins, chest X-ray
4. Echo to assess cardiac function
5. Admit for monitoring and optimization`,
    createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000),
  });

  await db.flashcards.bulkAdd([
    {
      caseNoteId: demoCase1 as number,
      question: 'What are the classic signs of acute appendicitis on physical examination?',
      answer: 'McBurney\'s point tenderness (RLQ tenderness 1/3 distance from ASIS to umbilicus), Rovsing\'s sign (RLQ pain with LLQ palpation), psoas sign (RLQ pain with right hip extension), obturator sign (RLQ pain with internal rotation of flexed right hip). Migration of pain from periumbilical to RLQ is highly specific.',
      nextReview: Date.now() - (1 * 24 * 60 * 60 * 1000),
      interval: 1,
      easeFactor: 2.5,
    },
    {
      caseNoteId: demoCase1 as number,
      question: 'What imaging is preferred for suspected appendicitis and why must we do a pregnancy test first?',
      answer: 'CT abdomen/pelvis with IV contrast is the gold standard (sensitivity >95%). Pregnancy test is mandatory before CT in women of childbearing age due to radiation exposure and contrast risks. If positive, ultrasound is first-line (though less sensitive ~85%). MRI is an alternative for pregnant patients when ultrasound is inconclusive.',
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
    },
    {
      caseNoteId: demoCase2 as number,
      question: 'What are the key clinical findings that suggest acute decompensated heart failure?',
      answer: 'Dyspnea, orthopnea, PND, peripheral edema, JVP elevation, S3 gallop, pulmonary crackles/rales, hepatomegaly. Volume overload signs: weight gain, decreased urine output. May have hypoxia. BNP >100 pg/mL or NT-proBNP >300 pg/mL supports diagnosis.',
      nextReview: Date.now(),
      interval: 1,
      easeFactor: 2.5,
    },
    {
      caseNoteId: demoCase2 as number,
      question: 'How do you manage acute decompensated heart failure in the ED?',
      answer: 'ABCs first. O2 to maintain SpO2 >92%. IV loop diuretic (furosemide 40mg or 2x home dose). Vasodilators (nitroglycerin) if hypertensive. BiPAP/CPAP if severe respiratory distress. Treat underlying causes (AFib rate control, hypertensive crisis). Monitor I&O, daily weights. Consider IV inotropes if cardiogenic shock. Admit to telemetry.',
      nextReview: Date.now() + (2 * 24 * 60 * 60 * 1000),
      interval: 3,
      easeFactor: 2.6,
    },
  ]);
}
