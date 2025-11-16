import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, RotateCcw, Check, X, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { db, type Flashcard } from "@/lib/db";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function Flashcards() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [sessionCards, setSessionCards] = useState<Pick<Flashcard, 'id' | 'question' | 'answer'>[]>([]);
  const { toast } = useToast();

  const { data: dueCards = [], isLoading } = useQuery<Flashcard[]>({
    queryKey: ['/api/flashcards/due-list'],
    queryFn: async () => {
      const now = Date.now();
      const cards = await db.flashcards.where('nextReview').below(now).toArray();
      return cards;
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, quality }: { id: number; quality: 'again' | 'good' | 'easy' }) => {
      const card = await db.flashcards.get(id);
      if (!card) throw new Error('Card not found');

      let newInterval = card.interval;
      let newEaseFactor = card.easeFactor;

      if (quality === 'again') {
        newInterval = 1;
        newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
      } else if (quality === 'good') {
        newInterval = Math.round(card.interval * card.easeFactor);
        newEaseFactor = card.easeFactor;
      } else {
        newInterval = Math.round(card.interval * card.easeFactor * 1.3);
        newEaseFactor = Math.min(2.5, card.easeFactor + 0.1);
      }

      const nextReview = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

      await db.flashcards.update(id, {
        interval: newInterval,
        easeFactor: newEaseFactor,
        nextReview,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due-list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due-count'] });
    },
  });

  const handleAnswer = async (quality: 'again' | 'good' | 'easy') => {
    const activeCards = practiceMode ? sessionCards : dueCards;
    const currentCard = activeCards[currentIndex];
    if (!currentCard?.id) return;

    if (!practiceMode) {
      await updateCardMutation.mutateAsync({ id: currentCard.id, quality });
    }

    setIsFlipped(false);

    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStudyComplete(true);
      toast({
        title: practiceMode ? "Practice Session Complete!" : "Study Session Complete!",
        description: `You reviewed ${activeCards.length} flashcard${activeCards.length !== 1 ? 's' : ''}.`,
      });
    }
  };

  // Capture a snapshot of the current due cards for potential replay.
  useEffect(() => {
    if (!practiceMode && sessionCards.length === 0 && dueCards.length > 0) {
      setSessionCards(dueCards.map(c => ({ id: c.id, question: c.question, answer: c.answer })));
    }
  }, [dueCards, practiceMode, sessionCards.length]);

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyComplete(false);
    setPracticeMode(false);
    // For a fresh study session, refetch due cards
    queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due-list'] });
    queryClient.invalidateQueries({ queryKey: ['/api/flashcards/due-count'] });
  };

  const replaySession = () => {
    if (sessionCards.length === 0) {
      // If for some reason we have no snapshot, fallback to current due cards
      setSessionCards(dueCards.map(c => ({ id: c.id, question: c.question, answer: c.answer })));
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyComplete(false);
    setPracticeMode(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="glass glass-header border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-2 bg-muted animate-pulse rounded" />
          </div>
          <Card className="min-h-[400px] flex items-center justify-center" data-testid="skeleton-flashcard">
            <p className="text-muted-foreground">Loading flashcards...</p>
          </Card>
        </main>
      </div>
    );
  }

  const activeCards = practiceMode ? sessionCards : dueCards;

  if (activeCards.length === 0 || studyComplete) {
    return (
      <div className="min-h-screen">
        <header className="glass glass-header border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-3">
            {studyComplete ? (practiceMode ? "Practice Complete!" : "Great Work!") : "No Cards Due"}
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {studyComplete
              ? (practiceMode
                  ? `You replayed your last set. Want another round?`
                  : `You've completed today's study session. Check back later for more cards to review.`)
              : "You're all caught up! Generate new cases and flashcards to continue learning."}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => setLocation('/')} data-testid="button-home">
              Return Home
            </Button>
            {studyComplete && (
              <Button variant="outline" onClick={replaySession} data-testid="button-study-again">
                <RotateCcw className="h-4 w-4 mr-2" />
                Study Again
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  const currentCard = activeCards[currentIndex];
  const questionText = typeof currentCard?.question === 'string'
    ? currentCard.question
    : (() => {
        try { return JSON.stringify(currentCard?.question ?? ""); } catch { return String(currentCard?.question ?? ""); }
      })();
  const answerText = typeof currentCard?.answer === 'string'
    ? currentCard.answer
    : (() => {
        try { return JSON.stringify(currentCard?.answer ?? ""); } catch { return String(currentCard?.answer ?? ""); }
      })();
  const progress = activeCards.length > 0 ? ((currentIndex + 1) / activeCards.length) * 100 : 0;

  return (
    <div className="min-h-screen">
      <header className="glass glass-header border-b sticky top-0 z-50">
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
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="glass border-white/20 font-semibold" data-testid="badge-progress">
              {currentIndex + 1} of {activeCards.length}
            </Badge>
            {practiceMode && (
              <Badge variant="outline" className="font-medium">Practice</Badge>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
            <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-study" />
        </div>

        <div className="perspective-1000">
          <Card
            className={`min-h-[400px] cursor-pointer transition-all duration-500 transform ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={() => setIsFlipped(!isFlipped)}
            data-testid="card-flashcard"
          >
            {!isFlipped ? (
              <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Badge variant="outline" className="mb-6" data-testid="badge-question">
                  Question
                </Badge>
                <p className="text-xl text-foreground text-center leading-relaxed mb-8" data-testid="text-question">
                  {questionText}
                </p>
                <p className="text-sm text-muted-foreground">Click to reveal answer</p>
              </div>
            ) : (
              <div className="p-8 flex flex-col min-h-[400px]">
                <Badge variant="outline" className="mb-6 w-fit" data-testid="badge-answer">
                  Answer
                </Badge>
                <p className="text-base text-foreground leading-relaxed flex-1" data-testid="text-answer">
                  {answerText}
                </p>
              </div>
            )}
          </Card>
        </div>

        {isFlipped && (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-center text-muted-foreground font-medium">How well did you know this?</p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleAnswer('again')}
                disabled={updateCardMutation.isPending}
                className="flex-col h-auto py-4 gap-2"
                data-testid="button-again"
              >
                <X className="h-5 w-5 text-destructive" />
                <span className="font-medium">Again</span>
                <span className="text-xs text-muted-foreground">Review soon</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAnswer('good')}
                disabled={updateCardMutation.isPending}
                className="flex-col h-auto py-4 gap-2"
                data-testid="button-good"
              >
                <Check className="h-5 w-5 text-primary" />
                <span className="font-medium">Good</span>
                <span className="text-xs text-muted-foreground">Normal interval</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAnswer('easy')}
                disabled={updateCardMutation.isPending}
                className="flex-col h-auto py-4 gap-2"
                data-testid="button-easy"
              >
                <Check className="h-5 w-5 text-chart-2" />
                <span className="font-medium">Easy</span>
                <span className="text-xs text-muted-foreground">Longer interval</span>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
