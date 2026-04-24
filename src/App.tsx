import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import PageWrapper from "@/components/PageWrapper";
import { AuthProvider, useAuth } from "@/lib/auth";
import { clearSignupDraft, readSignupDraft } from "@/lib/authDraft";
import { saveUserProfile } from "@/lib/userProfileStore";
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
import AuthPage from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const PUBLIC_PATHS = new Set(["/auth", "/auth/callback", "/callback"]);

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">The Perfect Walk</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Loading your practice…</h1>
        </div>
      </div>
    );
  }

  const isPublicPath = PUBLIC_PATHS.has(location.pathname);

  if (!user && !isPublicPath) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (user && location.pathname === "/auth") {
    return <Navigate to="/" replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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

const AuthBootstrapper = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const bootstrap = async () => {
      const draft = readSignupDraft();
      if (!draft) return;

      try {
        await saveUserProfile({
          onboarded: true,
          personalized: false,
          spiritualLanguage: draft.spiritualLanguage,
          personalizationAnswers: {
            signupGoals: draft.goals.join(", "),
            preferredWindow: draft.preferredWindow,
            walkDuration: draft.walkDuration,
          },
        });
        clearSignupDraft();
        await queryClient.invalidateQueries();
      } catch (error) {
        console.error("Failed to bootstrap authenticated profile", error);
      }
    };

    void bootstrap();
  }, [user, queryClient]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthBootstrapper />
          <AnimatedRoutes />
          <BottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
