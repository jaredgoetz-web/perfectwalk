import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, Flame, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import brandingImage from "@/assets/branding.jpg";
import { getStreak, getTotalWalks, getTotalMinutes } from "@/lib/walkStore";

const Index = () => {
  const navigate = useNavigate();
  const streak = getStreak();
  const totalWalks = getTotalWalks();
  const totalMinutes = getTotalMinutes();

  const stats = [
    { icon: Flame, label: "Streak", value: `${streak} day${streak !== 1 ? "s" : ""}` },
    { icon: TrendingUp, label: "Total Walks", value: totalWalks.toString() },
    { icon: Clock, label: "Minutes", value: totalMinutes.toString() },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="relative h-[55vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Sunrise walking path"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-transparent to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-5xl font-bold tracking-tight text-primary-foreground drop-shadow-lg md:text-6xl"
          >
            The Perfect Walk
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-3 max-w-sm font-body text-base text-primary-foreground/90 drop-shadow"
          >
            Open your heart. Awaken your power. Transform your mornings.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            <Button
              size="lg"
              onClick={() => navigate("/walk")}
              className="gradient-sunrise gap-2 rounded-full px-8 py-6 text-lg font-semibold text-primary-foreground shadow-warm"
            >
              <Play className="h-5 w-5" />
              Start Your Walk
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto -mt-8 max-w-lg px-5">
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
            The Perfect Walk is a 25-minute morning practice that activates every part of your energetic being. 
            Through five intentional phases — opening your heart, feeling your power, connecting with source, 
            letting go, and celebration — you'll transform your day before it begins.
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
