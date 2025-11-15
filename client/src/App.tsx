import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import EncounterVoice from "@/pages/encounter-voice";
import EncounterText from "@/pages/encounter-text";
import RecallCheckpoint from "@/pages/recall-checkpoint";
import Compare from "@/pages/compare";
import Flashcards from "@/pages/flashcards";
import Cases from "@/pages/cases";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/encounter/voice" component={EncounterVoice} />
      <Route path="/encounter/text" component={EncounterText} />
      <Route path="/recall-checkpoint" component={RecallCheckpoint} />
      <Route path="/compare" component={Compare} />
      <Route path="/flashcards" component={Flashcards} />
      <Route path="/cases" component={Cases} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
