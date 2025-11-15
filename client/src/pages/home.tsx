import { Link } from "wouter";
import { Mic, FileText, FolderOpen, Brain, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";

export default function Home() {
  const { data: totalCases = 0, isLoading: isLoadingCases } = useQuery({
    queryKey: ["/api/cases/count"],
    queryFn: async () => {
      const count = await db.caseNotes.count();
      return count;
    },
  });

  const { data: dueFlashcards = 0, isLoading: isLoadingFlashcards } = useQuery({
    queryKey: ["/api/flashcards/due"],
    queryFn: async () => {
      const now = Date.now();
      const cards = await db.flashcards.where('nextReview').below(now).count();
      return cards;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Clinical Notes</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4" data-testid="badge-status">
            Demo Mode • No PHI
          </Badge>
          <h2 className="text-4xl font-semibold text-foreground mb-3 tracking-tight">
            Transform Encounters into Learning
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Capture patient encounters, generate SOAP notes with AI assistance, and strengthen clinical reasoning through active recall and spaced repetition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/encounter/voice">
            <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all h-full" data-testid="card-voice-encounter">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline">Quick</Badge>
                </div>
                <CardTitle className="text-xl mt-4">Voice Encounter</CardTitle>
                <CardDescription className="leading-relaxed">
                  Record patient encounter with voice. AI transcribes and generates structured SOAP notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" data-testid="button-start-voice">
                  Start Recording
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/encounter/text">
            <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all h-full" data-testid="card-text-encounter">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline">Detailed</Badge>
                </div>
                <CardTitle className="text-xl mt-4">Text Encounter</CardTitle>
                <CardDescription className="leading-relaxed">
                  Type or paste encounter notes. Perfect for detailed documentation or existing notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-start-text">
                  Start Typing
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-elevate" data-testid="card-stat-cases">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCases ? (
                <div className="h-10 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-semibold text-foreground" data-testid="text-total-cases">{totalCases}</p>
              )}
              <Link href="/cases">
                <Button variant="link" className="px-0 h-auto mt-2 text-sm" data-testid="link-view-all-cases">
                  View all cases →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-stat-flashcards">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Due for Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFlashcards ? (
                <div className="h-10 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-semibold text-foreground" data-testid="text-due-flashcards">{dueFlashcards}</p>
              )}
              <Link href="/flashcards">
                <Button variant="link" className="px-0 h-auto mt-2 text-sm" data-testid="link-study-flashcards">
                  Study now →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-learning">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Learning</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                Strengthen clinical reasoning through recall checkpoints and spaced repetition
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 rounded-lg bg-accent/50 border border-accent-foreground/10">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">How It Works</h3>
              <ol className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <li><span className="font-medium text-foreground">1. Capture</span> – Record or type patient encounter details</li>
                <li><span className="font-medium text-foreground">2. Recall</span> – Enter your diagnosis and plan before seeing AI suggestions</li>
                <li><span className="font-medium text-foreground">3. Compare</span> – Review AI-generated SOAP note alongside your assessment</li>
                <li><span className="font-medium text-foreground">4. Learn</span> – Generate flashcards and reinforce knowledge with spaced repetition</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
