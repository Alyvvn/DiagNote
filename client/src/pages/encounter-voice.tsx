import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Mic, Square, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { transcribeWithElevenLabs, generateSOAPwithAzure } from "@/lib/ai-services";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

export default function EncounterVoice() {
  const [, setLocation] = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      const transcript = await transcribeWithElevenLabs(audioBlob);
      const aiDraft = await generateSOAPwithAzure(transcript);
      
      sessionStorage.setItem('encounterTranscript', transcript);
      sessionStorage.setItem('encounterAIDraft', aiDraft);
      sessionStorage.setItem('encounterMode', 'voice');
      
      setLocation('/recall-checkpoint');
    } catch (error: any) {
      const code = (error as any)?.code;
      if (code === 'CONFIG') {
        toast({
          title: 'Configuration Required',
          description: 'Speech-to-text not configured. Set ELEVENLABS_API_KEY on server.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Processing Error',
          description: 'Failed to process recording. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            className="hover-elevate hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4" data-testid="badge-mode">
            Voice Encounter
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground mb-3">Record Patient Encounter</h1>
          <p className="text-muted-foreground leading-relaxed">
            Describe the patient presentation, history, physical exam findings, and any relevant details
          </p>
        </div>

        <Card data-testid="card-recording">
          <CardHeader>
            <CardTitle>Voice Recording</CardTitle>
            <CardDescription>
              Click the microphone to start recording. Speak clearly and include all relevant clinical information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center py-12">
              {!audioBlob && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
                  className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground hover-elevate active-elevate-2'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-8 w-8" />
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full animate-pulse" />
                    </>
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </button>
              )}

              {isRecording && (
                <div className="mt-6 space-y-3">
                  <p className="text-2xl font-semibold text-foreground tabular-nums" data-testid="text-recording-time">
                    {formatTime(recordingTime)}
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="h-12 flex items-end gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-destructive rounded-full animate-pulse"
                          style={{
                            height: `${20 + (i % 3) * 15}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-destructive font-medium">Recording...</span>
                  </div>
                </div>
              )}

              {audioBlob && !isRecording && (
                <div className="space-y-4">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-foreground">Recording Complete</p>
                    <p className="text-sm text-muted-foreground">Duration: {formatTime(recordingTime)}</p>
                  </div>
                </div>
              )}
            </div>

            {audioBlob && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAudioBlob(null);
                    setRecordingTime(0);
                  }}
                  className="flex-1"
                  data-testid="button-re-record"
                >
                  Re-record
                </Button>
                <Button
                  onClick={processRecording}
                  disabled={isProcessing}
                  className="flex-1"
                  data-testid="button-generate-soap"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Generate SOAP Note'
                  )}
                </Button>
              </div>
            )}

            {!audioBlob && !isRecording && (
              <div className="text-center text-sm text-muted-foreground">
                Press the microphone button to begin recording
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Recording Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1 leading-relaxed">
            <li>• Find a quiet environment to minimize background noise</li>
            <li>• Speak clearly and at a moderate pace</li>
            <li>• Include patient age, chief complaint, history, and exam findings</li>
            <li>• Mention relevant vitals and test results if available</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
