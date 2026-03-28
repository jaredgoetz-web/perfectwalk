import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Flame, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import walkSilhouette from "@/assets/walk-silhouette-color.png";
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
      <div className="relative flex flex-col items-center justify-center overflow-hidden px-6 pb-14 pt-16"
        style={{
          background: "radial-gradient(ellipse at 20% 0%, hsl(350 50% 85% / 0.5) 0%, transparent 50%), radial-gradient(ellipse at 80% 10%, hsl(220 60% 88% / 0.6) 0%, transparent 45%), radial-gradient(ellipse at 50% 80%, hsl(260 35% 88% / 0.4) 0%, transparent 50%), radial-gradient(ellipse at center, hsl(30 30% 97%) 0%, hsl(30 30% 97%) 100%)",
        }}
      >
        {/* Soft decorative orbs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 2 }}
          className="pointer-events-none absolute -left-10 top-8 h-32 w-32 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(350 60% 70% / 0.4), transparent 70%)" }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 2, delay: 0.3 }}
          className="pointer-events-none absolute -right-8 top-20 h-28 w-28 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(30 80% 65% / 0.35), transparent 70%)" }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="pointer-events-none absolute bottom-16 left-12 h-20 w-20 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(260 40% 75% / 0.35), transparent 70%)" }}
        />

        {/* Golden ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative flex h-56 w-56 items-center justify-center rounded-full shadow-lg"
          style={{
            background: "linear-gradient(135deg, hsl(38 90% 55%), hsl(28 85% 50%))",
            padding: "5px",
          }}
        >
          <div className="relative flex h-full w-full flex-col items-center justify-center overflow-visible rounded-full text-center"
            style={{ background: "radial-gradient(circle at center, white 60%, hsl(220 40% 96%) 100%)" }}
          >
            {/* Silhouette behind text */}
            <img
              src={walkSilhouette}
              alt="Walking silhouette"
              className="absolute -bottom-10 h-56 w-auto opacity-20"
            />
            <span className="relative z-10 font-display text-sm font-medium tracking-[0.25em] uppercase" style={{ color: "hsl(220 50% 25%)" }}>
              The
            </span>
            <span className="relative z-10 font-display text-[2.1rem] font-bold leading-none tracking-tight" style={{ color: "hsl(220 55% 18%)" }}>
              Perfect
            </span>
            <span className="relative z-10 font-display text-[2.1rem] font-bold leading-none tracking-tight" style={{ color: "hsl(220 55% 18%)" }}>
              Walk
            </span>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-5 font-display text-base italic text-muted-foreground"
        >
          Open your heart. Transform your morning.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6"
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
