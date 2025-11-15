import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, User, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { db } from "@/lib/db";
import { generateFlashcardsFromCase } from "@/lib/ai-services";
import { extractSOAPSections, highlightDifferences } from "@/lib/diff-utils";

export default function Compare() {
  const [, setLocation] = useLocation();
  const [transcript, setTranscript] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [clinicianDiagnosis, setClinicianDiagnosis] = useState("");
  const [clinicianPlan, setClinicianPlan] = useState("");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedTranscript = sessionStorage.getItem('encounterTranscript');
    const storedAIDraft = sessionStorage.getItem('encounterAIDraft');
    const storedDiagnosis = sessionStorage.getItem('clinicianDiagnosis');
    const storedPlan = sessionStorage.getItem('clinicianPlan');

    if (!storedTranscript || !storedAIDraft || !storedDiagnosis || !storedPlan) {
      toast({
        title: "Missing Data",
        description: "Please complete the recall checkpoint first.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    setTranscript(storedTranscript);
    setAiDraft(storedAIDraft);
    setClinicianDiagnosis(storedDiagnosis);
    setClinicianPlan(storedPlan);
  }, [setLocation, toast]);

  const generateFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const caseId = await db.caseNotes.add({
        transcript,
        aiDraft,
        clinicianDiagnosis,
        clinicianPlan,
        createdAt: Date.now(),
      });

      const flashcardData = await generateFlashcardsFromCase(
        transcript,
        aiDraft,
        clinicianDiagnosis,
        clinicianPlan
      );

      const flashcards = flashcardData.map(card => ({
        caseNoteId: caseId as number,
        question: card.question,
        answer: card.answer,
        nextReview: Date.now(),
        interval: 1,
        easeFactor: 2.5,
      }));

      await db.flashcards.bulkAdd(flashcards);

      sessionStorage.clear();

      toast({
        title: "Success!",
        description: `Case saved and ${flashcards.length} flashcards generated.`,
      });

      setLocation('/flashcards');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const saveWithoutFlashcards = async () => {
    try {
      await db.caseNotes.add({
        transcript,
        aiDraft,
        clinicianDiagnosis,
        clinicianPlan,
        createdAt: Date.now(),
      });

      sessionStorage.clear();

      toast({
        title: "Case Saved",
        description: "Case note saved successfully.",
      });

      setLocation('/cases');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save case. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            data-testid="button-back"
            className="hover-elevate"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4" data-testid="badge-compare">
            <Check className="h-3 w-3 mr-1" />
            Compare & Learn
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground mb-3">Review Your Assessment</h1>
          <p className="text-muted-foreground leading-relaxed">
            Compare your clinical reasoning with the AI-generated SOAP note to identify learning opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card data-testid="card-your-assessment">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
                <CardTitle>Your Assessment</CardTitle>
              </div>
              <CardDescription>Your clinical diagnosis and treatment plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Diagnosis</h3>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-foreground leading-relaxed" data-testid="text-your-diagnosis">
                    {clinicianDiagnosis}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Treatment Plan</h3>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-foreground leading-relaxed" data-testid="text-your-plan">
                    {clinicianPlan}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-ai-draft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle>AI-Generated SOAP Note</CardTitle>
              </div>
              <CardDescription>Structured clinical documentation with evidence-based recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 max-h-[600px] overflow-y-auto">
                <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans" data-testid="text-ai-soap">
                  {aiDraft}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={generateFlashcards}
            disabled={isGeneratingFlashcards}
            className="flex-1"
            size="lg"
            data-testid="button-generate-flashcards"
          >
            {isGeneratingFlashcards ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Save & Generate Flashcards
              </>
            )}
          </Button>
          <Button
            onClick={saveWithoutFlashcards}
            disabled={isGeneratingFlashcards}
            variant="outline"
            className="sm:w-auto"
            size="lg"
            data-testid="button-save-only"
          >
            Save Case Only
          </Button>
        </div>

        <div className="mt-8 p-6 rounded-lg bg-accent/30 border border-accent-foreground/20">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
            Reflection Points
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <li>• Did you identify the same primary diagnosis as the AI?</li>
            <li>• Were there any differential diagnoses you missed or included that the AI didn't?</li>
            <li>• How does your treatment plan compare? Any additional interventions to consider?</li>
            <li>• What workup or tests did the AI recommend that you didn't think of?</li>
            <li>• Generate flashcards to reinforce key learning points from this case</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
