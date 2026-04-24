import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Flame, Clock, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import brandingImage from "@/assets/branding.jpg";
import { getStreakFromEntries, getTotalMinutesFromEntries, getTotalWalksFromEntries, useWalkEntries } from "@/lib/walkStore";
import { useUserProfile } from "@/lib/userProfileStore";
import OnboardingFlow from "@/components/OnboardingFlow";
import PersonalizationChat from "@/components/PersonalizationChat";

const Index = () => {
  const navigate = useNavigate();
  const { data: entries = [] } = useWalkEntries();
  const { data: profile } = useUserProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);

  const streak = getStreakFromEntries(entries);
  const totalWalks = getTotalWalksFromEntries(entries);
  const totalMinutes = getTotalMinutesFromEntries(entries);
  const isNewUser = totalWalks === 0;

  const lastEntry = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
    [entries],
  );

  useEffect(() => {
    if (!profile) return;
    setShowOnboarding(!profile.onboarded);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setShowPersonalization(profile.onboarded && totalWalks > 0 && !profile.personalized);
  }, [profile, totalWalks]);

  const stats = [
    { icon: Flame, label: "Streak", value: `${streak}`, unit: streak === 1 ? "day" : "days" },
    { icon: TrendingUp, label: "Walks", value: `${totalWalks}`, unit: "walks" },
    { icon: Clock, label: "Minutes", value: `${totalMinutes}`, unit: "min" },
  ];

  const onboardingOpen = Boolean(profile) && showOnboarding;
  const personalizationOpen = Boolean(profile) && !onboardingOpen && showPersonalization;

  return (
    <div className="min-h-screen pb-24">
      {onboardingOpen && (
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
          }}
        />
      )}
      {personalizationOpen && (
        <PersonalizationChat
          onComplete={() => {
            setShowPersonalization(false);
          }}
          onSkip={() => setShowPersonalization(false)}
        />
      )}

      {isNewUser ? (
        <>
          <div className="relative overflow-hidden">
            <img src={brandingImage} alt="The Perfect Walk" className="h-auto w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          </div>

          <div className="mx-auto -mt-16 max-w-lg px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="rounded-3xl bg-card p-8 shadow-elevated text-center"
            >
              <h2 className="font-display text-2xl font-bold text-foreground">Your first walk is waiting.</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                25 minutes that will change how your whole day feels. Get out before your mind turns on.
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-6">
                <Button
                  size="lg"
                  onClick={() => navigate("/walk")}
                  className="w-full gap-2 rounded-full py-7 text-lg font-semibold text-white shadow-glow"
                  style={{ background: "linear-gradient(135deg, hsl(38 90% 55%), hsl(28 85% 50%))" }}
                >
                  <Play className="h-5 w-5" />
                  Start Your Walk
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </>
      ) : (
        <>
          <div className="relative overflow-hidden">
            <img src={brandingImage} alt="The Perfect Walk" className="h-auto w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-x-0 bottom-8 flex justify-center"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  onClick={() => navigate("/walk")}
                  className="gap-2 rounded-full px-12 py-7 text-lg font-semibold text-white shadow-glow"
                  style={{ background: "linear-gradient(135deg, hsl(38 90% 55%), hsl(28 85% 50%))" }}
                >
                  <Play className="h-5 w-5" />
                  Start Your Walk
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {profile?.futureSelf && (
            <div className="mx-auto -mt-3 max-w-lg px-5">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-center py-4"
              >
                <p className="font-display text-base italic text-foreground/70 leading-relaxed">
                  "{profile.futureSelf}"
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Day {totalWalks} of your practice</p>
              </motion.div>
            </div>
          )}

          <div className="mx-auto max-w-lg px-5 mt-2">
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ icon: Icon, label, value, unit }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-card px-3 py-4 shadow-warm"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-display text-2xl font-bold text-foreground">{value}</span>
                  <span className="text-[11px] text-muted-foreground">{unit}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {lastEntry?.journalEntry && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="mx-auto mt-5 max-w-lg px-5"
            >
              <div className="rounded-2xl bg-card p-5 shadow-warm">
                <p className="text-xs font-medium text-muted-foreground">From your last walk</p>
                <p className="mt-2 text-sm italic leading-relaxed text-foreground/80">
                  "{lastEntry.journalEntry}"
                </p>
                <p className="mt-2 text-xs text-muted-foreground">What opens today?</p>
              </div>
            </motion.div>
          )}

          {streak >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mx-auto mt-4 max-w-lg px-5"
            >
              <div className="flex items-start gap-3 rounded-2xl bg-primary/5 p-4">
                <Sparkles className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <p className="text-sm text-foreground/80">{streak} days straight. The practice is becoming who you are.</p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Index;
