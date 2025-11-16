import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Play, Square } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { generateSOAPwithAzure, speakWithElevenLabs } from "@/lib/ai-services";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

export default function EncounterText() {
  const [, setLocation] = useLocation();
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const playText = async () => {
    if (!textInput.trim()) {
      toast({
        title: "No Text",
        description: "Please enter text to play.",
        variant: "destructive",
      });
      return;
    }

    if (isPlayingTTS && currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlayingTTS(false);
      return;
    }

    try {
      setIsPlayingTTS(true);
      const audioUrl = await speakWithElevenLabs(textInput);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.onended = () => {
        setIsPlayingTTS(false);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setIsPlayingTTS(false);
        setCurrentAudio(null);
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      setIsPlayingTTS(false);
      setCurrentAudio(null);
      toast({
        title: "TTS Error",
        description: "Failed to convert text to speech. Please try again.",
        variant: "destructive",
      });
    }
  };

  const processText = async () => {
    if (!textInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter encounter details before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const aiDraft = await generateSOAPwithAzure(textInput);
      
      sessionStorage.setItem('encounterTranscript', textInput);
      sessionStorage.setItem('encounterAIDraft', aiDraft);
      sessionStorage.setItem('encounterMode', 'text');
      
      setLocation('/recall-checkpoint');
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to generate SOAP note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
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
          <Badge variant="secondary" className="mb-4" data-testid="badge-mode">
            Text Encounter
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground mb-3">Enter Patient Encounter</h1>
          <p className="text-muted-foreground leading-relaxed">
            Type or paste your encounter notes. Include patient presentation, history, exam findings, and relevant details.
          </p>
        </div>

        <Card data-testid="card-text-input">
          <CardHeader>
            <CardTitle>Encounter Details</CardTitle>
            <CardDescription>
              Provide comprehensive clinical information for accurate SOAP note generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              placeholder="Example:&#10;&#10;Patient is a 45-year-old male presenting with chief complaint of chest pain for the past 3 days. Pain is sharp, located in left chest, worse with deep breathing and movement. No radiation. Denies SOB or nausea. PMH: HTN on lisinopril. No recent trauma.&#10;&#10;Vitals: BP 140/85, HR 78, RR 16, Temp 98.6°F&#10;Physical exam: Reproducible chest wall tenderness on palpation..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="min-h-[300px] resize-y text-base leading-relaxed"
              data-testid="textarea-encounter-notes"
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {textInput.length} characters
              </span>
              <span className="text-muted-foreground">
                {textInput.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={playText}
                variant="outline"
                disabled={!textInput.trim() || isProcessing}
                className="flex items-center gap-2"
                size="lg"
              >
                {isPlayingTTS ? (
                  <>
                    <Square className="h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Play Text
                  </>
                )}
              </Button>
              <Button
                onClick={processText}
                disabled={isProcessing || !textInput.trim()}
                className="flex-1"
                size="lg"
                data-testid="button-generate-soap"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating SOAP Note...
                  </>
                ) : (
                  'Generate SOAP Note'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Include These Elements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">History</p>
              <ul className="space-y-0.5 leading-relaxed">
                <li>• Chief complaint</li>
                <li>• Present illness details</li>
                <li>• Past medical history</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Examination</p>
              <ul className="space-y-0.5 leading-relaxed">
                <li>• Vital signs</li>
                <li>• Physical exam findings</li>
                <li>• Pertinent positives/negatives</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
