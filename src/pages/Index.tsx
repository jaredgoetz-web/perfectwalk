import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Flame, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import brandingImage from "@/assets/branding.jpg";
import { getStreak, getTotalWalks, getTotalMinutes } from "@/lib/walkStore";
import OnboardingFlow from "@/components/OnboardingFlow";
import PersonalizationChat from "@/components/PersonalizationChat";

const Index = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("tpw_onboarded")
  );
  const [showPersonalization, setShowPersonalization] = useState(false);
  const streak = getStreak();
  const totalWalks = getTotalWalks();
  const totalMinutes = getTotalMinutes();

  const stats = [
    { icon: Flame, label: "Streak", value: `${streak} day${streak !== 1 ? "s" : ""}` },
    { icon: TrendingUp, label: "Walks", value: totalWalks.toString() },
    { icon: Clock, label: "Minutes", value: totalMinutes.toString() },
  ];

  return (
    <div className="min-h-screen pb-24">
      {showOnboarding && (
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
            if (!localStorage.getItem("tpw_personalized")) {
              setShowPersonalization(true);
            }
          }}
        />
      )}
      {showPersonalization && (
        <PersonalizationChat
          onComplete={() => {
            setShowPersonalization(false);
            navigate("/walk");
          }}
          onSkip={() => setShowPersonalization(false)}
        />
      )}
      {/* Hero */}
      <div className="relative overflow-hidden">
        <img
          src={brandingImage}
          alt="The Perfect Walk"
          className="h-auto w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute inset-x-0 bottom-8 flex justify-center"
        >
          <Button
            size="lg"
            onClick={() => navigate("/walk")}
            className="gap-2 rounded-full px-10 py-6 text-lg font-semibold text-white shadow-warm"
            style={{ background: "linear-gradient(135deg, hsl(38 90% 55%), hsl(28 85% 50%))" }}
          >
            <Play className="h-5 w-5" />
            Start Your Walk
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="mx-auto -mt-5 max-w-lg px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-3"
        >
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl bg-card px-4 pt-5 pb-4 shadow-elevated"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="font-display text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Intro */}
      <div className="mx-auto mt-8 max-w-lg px-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Your Morning Ritual
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A 25-minute morning practice that activates every part of your energetic being
            through five intentional phases.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/playlists")}
              className="flex-1 rounded-full"
            >
              Browse Playlists
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/journal")}
              className="flex-1 rounded-full"
            >
              View Journal
            </Button>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Index;
