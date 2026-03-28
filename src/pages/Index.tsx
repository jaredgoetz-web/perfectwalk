import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Flame, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStreak, getTotalWalks, getTotalMinutes } from "@/lib/walkStore";

const Index = () => {
  const navigate = useNavigate();
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
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-16"
        style={{
          background: "radial-gradient(ellipse at center top, hsl(220 60% 92%) 0%, hsl(260 30% 88%) 30%, hsl(30 30% 97%) 70%)",
        }}
      >
        {/* Golden ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative flex h-48 w-48 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, hsl(38 90% 55%), hsl(32 80% 50%))",
            padding: "4px",
          }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
            <span className="font-display text-sm font-medium tracking-widest uppercase" style={{ color: "hsl(220 50% 25%)" }}>
              The
            </span>
            <span className="font-display text-3xl font-bold leading-none tracking-tight" style={{ color: "hsl(220 50% 20%)" }}>
              Perfect
            </span>
            <span className="font-display text-3xl font-bold leading-none tracking-tight" style={{ color: "hsl(220 50% 20%)" }}>
              Walk
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <Button
            size="lg"
            onClick={() => navigate("/walk")}
            className="gap-2 rounded-full px-10 py-6 text-lg font-semibold text-white shadow-warm"
            style={{ background: "linear-gradient(135deg, hsl(38 90% 55%), hsl(32 80% 50%))" }}
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
              className="flex flex-col items-center gap-1 rounded-xl bg-card p-4 shadow-elevated"
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
