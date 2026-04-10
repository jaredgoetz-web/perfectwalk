import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import PageWrapper from "@/components/PageWrapper";
import Index from "./pages/Index";
import Walk from "./pages/Walk";
import Playlists from "./pages/Playlists";
import Journal from "./pages/Journal";
import JournalNew from "./pages/JournalNew";
import Stats from "./pages/Stats";
import Learn from "./pages/Learn";
import Coach from "./pages/Coach";
import You from "./pages/You";
import SpotifyCallback from "./pages/SpotifyCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
        <Route path="/walk" element={<PageWrapper><Walk /></PageWrapper>} />
        <Route path="/playlists" element={<PageWrapper><Playlists /></PageWrapper>} />
        <Route path="/journal" element={<PageWrapper><Journal /></PageWrapper>} />
        <Route path="/journal/new" element={<PageWrapper><JournalNew /></PageWrapper>} />
        <Route path="/stats" element={<PageWrapper><Stats /></PageWrapper>} />
        <Route path="/learn" element={<PageWrapper><Learn /></PageWrapper>} />
        <Route path="/coach" element={<PageWrapper><Coach /></PageWrapper>} />
        <Route path="/you" element={<PageWrapper><You /></PageWrapper>} />
        <Route path="/callback" element={<SpotifyCallback />} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
