import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar, Sparkles, FileText, Trash2, Play, Square } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { db, type CaseNote } from "@/lib/db";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { speakWithElevenLabsStreaming } from "@/lib/ai-services";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Cases() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseNote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<number | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState<number | null>(null); // Track which case is playing
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const { data: cases = [], isLoading } = useQuery<CaseNote[]>({
    queryKey: ['/api/cases'],
    queryFn: async () => {
      const allCases = await db.caseNotes.orderBy('createdAt').reverse().toArray();
      return allCases;
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (id: number) => {
      await db.flashcards.where('caseNoteId').equals(id).delete();
      await db.caseNotes.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cases/count'] });
      toast({
        title: "Case Deleted",
        description: "Case and associated flashcards have been removed.",
      });
      setSelectedCase(null);
    },
  });

  const filteredCases = cases.filter(c =>
    c.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.aiDraft.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clinicianDiagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: number) => {
    setCaseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (caseToDelete) {
      deleteCaseMutation.mutate(caseToDelete);
    }
    setDeleteDialogOpen(false);
    setCaseToDelete(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const playAIDraft = async (caseNote: CaseNote) => {
    const caseId = caseNote.id!;
    
    if (isPlayingTTS === caseId && currentAudio) {
      // Stop current playback
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlayingTTS(null);
      setCurrentAudio(null);
      return;
    }

    try {
      setIsPlayingTTS(caseId);
      
      // Get streaming audio chunks for immediate playback
      const { chunks } = await speakWithElevenLabsStreaming(caseNote.aiDraft);
      
      if (chunks.length === 0) {
        throw new Error("No audio chunks received");
      }

      // Play chunks sequentially for seamless audio experience
      let currentIndex = 0;
      let audioUrls: string[] = [];
      
      const playNextChunk = () => {
        if (currentIndex >= chunks.length) {
          setIsPlayingTTS(null);
          setCurrentAudio(null);
          // Clean up object URLs
          audioUrls.forEach(url => URL.revokeObjectURL(url));
          return;
        }
        
        const chunk = chunks[currentIndex];
        const audio = new Audio(chunk.audio); // Base64 data URL, no need for object URL
        setCurrentAudio(audio);
        
        audio.onended = () => {
          currentIndex++;
          playNextChunk();
        };
        
        audio.onerror = () => {
          console.error(`Error playing chunk ${currentIndex}`);
          currentIndex++;
          playNextChunk();
        };
        
        audio.play().catch((error) => {
          console.error(`Failed to play chunk ${currentIndex}:`, error);
          currentIndex++;
          playNextChunk();
        });
      };
      
      // Start playing the first chunk immediately
      playNextChunk();
      
    } catch (error: any) {
      setIsPlayingTTS(null);
      setCurrentAudio(null);
      
      let title = "TTS Error";
      let description = error.message || "Failed to generate speech.";
      
      // Check for quota exceeded in error message
      if (error.message?.includes("quota") || error.message?.includes("credits")) {
        title = "TTS Quota Exceeded";
        description = "ElevenLabs API credits exhausted. Add credits at elevenlabs.io to enable text-to-speech.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  };

  if (selectedCase) {
    return (
      <div className="min-h-screen">
        <header className="glass glass-header border-b sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCase(null)}
              data-testid="button-back-to-list"
              className="hover-elevate"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedCase.id && handleDelete(selectedCase.id)}
                data-testid="button-delete-case"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{formatDate(selectedCase.createdAt)}</span>
            </div>
            <h1 className="text-3xl font-semibold text-foreground">Case Details</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card data-testid="card-case-transcript">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Encounter Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted/50 max-h-[300px] overflow-y-auto">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-case-transcript">
                      {selectedCase.transcript}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-case-assessment">
                <CardHeader>
                  <CardTitle>Your Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Diagnosis</h3>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-case-diagnosis">
                        {selectedCase.clinicianDiagnosis}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Treatment Plan</h3>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-case-plan">
                        {selectedCase.clinicianPlan}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-case-ai-draft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Generated SOAP Note
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playAIDraft(selectedCase)}
                    disabled={!selectedCase.aiDraft}
                    className="flex items-center gap-2"
                  >
                    {isPlayingTTS === selectedCase.id ? (
                      <>
                        <Square className="h-4 w-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Play AI Draft
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans" data-testid="text-case-ai-draft">
                    {selectedCase.aiDraft}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass glass-header border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            data-testid="button-back"
            className="hover-elevate hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Past <span className="text-gradient">Cases</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Review your previous patient encounters and clinical assessments
          </p>
        </div>

        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search cases by diagnosis, symptoms, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
            data-testid="input-search-cases"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} data-testid={`skeleton-case-${i}`}>
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCases.length === 0 ? (
          <Card className="text-center py-12" data-testid="card-no-cases">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'No matching cases found' : 'No cases yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Start documenting patient encounters to build your case library'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setLocation('/')} data-testid="button-create-case">
                  Create First Case
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((caseNote) => (
              <Card
                key={caseNote.id}
                className="hover-elevate active-elevate-2 transition-all"
                data-testid={`card-case-${caseNote.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedCase(caseNote)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(caseNote.createdAt)}
                        </span>
                      </div>
                      <CardTitle className="text-lg line-clamp-1">
                        {caseNote.clinicianDiagnosis.split('\n')[0] || 'Untitled Case'}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAIDraft(caseNote);
                        }}
                        disabled={!caseNote.aiDraft}
                        className="flex items-center gap-1"
                      >
                        {isPlayingTTS === caseNote.id ? (
                          <>
                            <Square className="h-4 w-4" />
                            <span className="sr-only">Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span className="sr-only">Play AI Draft</span>
                          </>
                        )}
                      </Button>
                      <Badge variant="secondary">Case</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => setSelectedCase(caseNote)} className="cursor-pointer">
                  <CardDescription className="line-clamp-2 leading-relaxed">
                    {caseNote.transcript}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this case and all associated flashcards. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
