import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import Walk from "./pages/Walk";
import Playlists from "./pages/Playlists";
import Journal from "./pages/Journal";
import JournalNew from "./pages/JournalNew";
import Stats from "./pages/Stats";
import Learn from "./pages/Learn";
import Coach from "./pages/Coach";
import SpotifyCallback from "./pages/SpotifyCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/walk" element={<Walk />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/new" element={<JournalNew />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/callback" element={<SpotifyCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
