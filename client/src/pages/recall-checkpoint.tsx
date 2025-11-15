import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Lightbulb, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RecallCheckpoint() {
  const [, setLocation] = useLocation();
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [transcript, setTranscript] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const storedTranscript = sessionStorage.getItem('encounterTranscript');
    const storedAIDraft = sessionStorage.getItem('encounterAIDraft');

    if (!storedTranscript || !storedAIDraft) {
      toast({
        title: "No Encounter Data",
        description: "Please start a new encounter first.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }

    setTranscript(storedTranscript);
    setAiDraft(storedAIDraft);
  }, [setLocation, toast]);

  const handleReveal = () => {
    if (!diagnosis.trim() || !plan.trim()) {
      toast({
        title: "Complete Your Assessment",
        description: "Please enter both diagnosis and treatment plan before revealing the AI draft.",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.setItem('clinicianDiagnosis', diagnosis);
    sessionStorage.setItem('clinicianPlan', plan);
    setLocation('/compare');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            data-testid="button-back"
            className="hover-elevate"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4" data-testid="badge-checkpoint">
            <Lightbulb className="h-3 w-3 mr-1" />
            Recall Checkpoint
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground mb-3">Test Your Clinical Reasoning</h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Before seeing the AI-generated SOAP note, enter your own assessment and plan. This active recall strengthens your diagnostic skills and clinical decision-making.
          </p>
        </div>

        <Alert className="mb-6 border-accent bg-accent/30" data-testid="alert-instructions">
          <AlertCircle className="h-4 w-4 text-accent-foreground" />
          <AlertDescription className="text-accent-foreground">
            Based on the encounter details, what diagnosis and treatment plan do you believe are correct?
          </AlertDescription>
        </Alert>

        <Card className="mb-6" data-testid="card-encounter-summary">
          <CardHeader>
            <CardTitle className="text-lg">Encounter Summary</CardTitle>
            <CardDescription>Review the patient presentation before making your assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-encounter-summary">
                {transcript}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card data-testid="card-diagnosis">
            <CardHeader>
              <Label htmlFor="diagnosis" className="text-base font-semibold">
                Your Diagnosis (Assessment)
              </Label>
              <CardDescription>
                What is your clinical assessment? Include differential diagnoses if relevant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="diagnosis"
                placeholder="Example:&#10;&#10;1. Costochondritis - most likely given reproducible chest wall tenderness&#10;2. Need to rule out: ACS, pulmonary embolism&#10;3. Hypertension - stable on current regimen"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="min-h-[180px] resize-y text-base leading-relaxed"
                data-testid="textarea-diagnosis"
              />
            </CardContent>
          </Card>

          <Card data-testid="card-plan">
            <CardHeader>
              <Label htmlFor="plan" className="text-base font-semibold">
                Your Treatment Plan
              </Label>
              <CardDescription>
                What diagnostic tests, treatments, and follow-up would you recommend?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="plan"
                placeholder="Example:&#10;&#10;1. Order ECG and troponins to rule out cardiac cause&#10;2. NSAIDs for pain and inflammation&#10;3. Rest and activity modification&#10;4. Follow up in 48-72 hours&#10;5. Return precautions for worsening symptoms"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="min-h-[180px] resize-y text-base leading-relaxed"
                data-testid="textarea-plan"
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleReveal}
            disabled={!diagnosis.trim() || !plan.trim()}
            className="w-full"
            size="lg"
            data-testid="button-reveal-ai-draft"
          >
            Reveal AI Draft SOAP Note
          </Button>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Why Active Recall Matters</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Retrieving information from memory strengthens neural pathways and improves long-term retention. By formulating your diagnosis and plan before seeing the AI suggestion, you're actively engaging your clinical reasoning skills rather than passively reviewing information.
          </p>
        </div>
      </main>
    </div>
  );
}
