import { Link } from "wouter";
import { Mic, FileText, FolderOpen, Brain, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Home() {
  const { data: totalCases = 0, isLoading: isLoadingCases } = useQuery({
    queryKey: ["/api/cases/count"],
    queryFn: () => api.getCaseCount(),
  });

  const { data: dueFlashcards = 0, isLoading: isLoadingFlashcards } = useQuery({
    queryKey: ["/api/flashcards/due"],
    queryFn: async () => {
      const cards = await api.getDueFlashcards();
      return cards.length;
    },
  });

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center primary-glow">
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">DiagNote</h1>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">AI Clinical Intelligence</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 glass border-white/20 shadow-lg" data-testid="badge-status">
            ✨ Demo Mode • No PHI
          </Badge>
          <h2 className="text-5xl font-bold text-foreground mb-4 tracking-tight">
            Transform Encounters into
            <span className="text-gradient"> Learning</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Capture patient encounters, generate SOAP notes with AI assistance, and strengthen clinical reasoning through active recall and spaced repetition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Link href="/encounter/voice">
            <Card className="glass hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 h-full border-white/20 shadow-xl hover:shadow-2xl" data-testid="card-voice-encounter">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center primary-glow">
                    <Mic className="h-7 w-7 text-white" strokeWidth={2} />
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary font-semibold">Quick</Badge>
                </div>
                <CardTitle className="text-2xl mt-6 font-bold">Voice Encounter</CardTitle>
                <CardDescription className="leading-relaxed text-base mt-2">
                  Record patient encounter with voice. AI transcribes and generates structured SOAP notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full shadow-lg primary-glow" size="lg" data-testid="button-start-voice">
                  Start Recording
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/encounter/text">
            <Card className="glass hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 h-full border-white/20 shadow-xl hover:shadow-2xl" data-testid="card-text-encounter">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-chart-2 to-primary flex items-center justify-center accent-glow">
                    <FileText className="h-7 w-7 text-white" strokeWidth={2} />
                  </div>
                  <Badge variant="outline" className="border-chart-2/30 text-chart-2 font-semibold">Detailed</Badge>
                </div>
                <CardTitle className="text-2xl mt-6 font-bold">Text Encounter</CardTitle>
                <CardDescription className="leading-relaxed text-base mt-2">
                  Type or paste encounter notes. Perfect for detailed documentation or existing notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full shadow-lg border-2" size="lg" data-testid="button-start-text">
                  Start Typing
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass hover-elevate border-white/20 shadow-lg" data-testid="card-stat-cases">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Cases</CardTitle>
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCases ? (
                <div className="h-10 w-20 bg-muted animate-pulse rounded-lg" />
              ) : (
                <p className="text-4xl font-bold text-gradient mb-1" data-testid="text-total-cases">{totalCases}</p>
              )}
              <Link href="/cases">
                <Button variant="link" className="px-0 h-auto mt-2 text-sm font-semibold text-primary" data-testid="link-view-all-cases">
                  View all cases →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass hover-elevate border-white/20 shadow-lg" data-testid="card-stat-flashcards">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Due for Review</CardTitle>
                <Clock className="h-5 w-5 text-chart-2" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFlashcards ? (
                <div className="h-10 w-20 bg-muted animate-pulse rounded-lg" />
              ) : (
                <p className="text-4xl font-bold text-gradient mb-1" data-testid="text-due-flashcards">{dueFlashcards}</p>
              )}
              <Link href="/flashcards">
                <Button variant="link" className="px-0 h-auto mt-2 text-sm font-semibold text-chart-2" data-testid="link-study-flashcards">
                  Study now →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass hover-elevate border-white/20 shadow-lg" data-testid="card-learning">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Learning</CardTitle>
                <Brain className="h-5 w-5 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed font-medium">
                Strengthen clinical reasoning through recall checkpoints and spaced repetition
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 glass p-8 rounded-2xl border-white/20 shadow-xl">
          <div className="flex items-start gap-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 primary-glow">
              <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-foreground mb-4">How It Works</h3>
              <ol className="text-base text-muted-foreground space-y-3 leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-primary text-lg">1.</span>
                  <div><span className="font-semibold text-foreground">Capture</span> – Record or type patient encounter details</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-primary text-lg">2.</span>
                  <div><span className="font-semibold text-foreground">Recall</span> – Enter your diagnosis and plan before seeing AI suggestions</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-primary text-lg">3.</span>
                  <div><span className="font-semibold text-foreground">Compare</span> – Review AI-generated SOAP note alongside your assessment</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-primary text-lg">4.</span>
                  <div><span className="font-semibold text-foreground">Learn</span> – Generate flashcards and reinforce knowledge with spaced repetition</div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
