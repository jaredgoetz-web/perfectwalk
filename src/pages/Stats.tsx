import { motion } from "framer-motion";
import { Flame, TrendingUp, Clock, Calendar, Heart } from "lucide-react";
import { getStreak, getTotalWalks, getTotalMinutes, getWalkEntries, moodEmoji } from "@/lib/walkStore";

const Stats = () => {
  const streak = getStreak();
  const totalWalks = getTotalWalks();
  const totalMinutes = getTotalMinutes();
  const entries = getWalkEntries();

  const moodCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  const thisWeek = entries.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 86400000;
    return diff <= 7;
  }).length;

  const stats = [
    { icon: Flame, label: "Current Streak", value: `${streak}`, unit: streak === 1 ? "day" : "days", color: "text-accent" },
    { icon: TrendingUp, label: "Total Walks", value: `${totalWalks}`, unit: "walks", color: "text-primary" },
    { icon: Clock, label: "Total Time", value: `${totalMinutes}`, unit: "minutes", color: "text-warm-glow" },
    { icon: Calendar, label: "This Week", value: `${thisWeek}`, unit: "walks", color: "text-sage-green" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-lg px-5 pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Your Stats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your growth, one walk at a time
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl bg-card p-5 shadow-warm"
              >
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <p className="mt-3 font-display text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stat.unit}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Top mood */}
        {topMood && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center gap-4 rounded-xl bg-card p-5 shadow-warm"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Heart className="h-6 w-6 text-dawn-rose" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                Most Common Mood
              </p>
              <p className="text-sm text-muted-foreground">
                {moodEmoji[topMood[0]]} {topMood[0].charAt(0).toUpperCase() + topMood[0].slice(1)} — {topMood[1]} time{topMood[1] !== 1 ? "s" : ""}
              </p>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {totalWalks === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <p className="font-display text-xl font-semibold text-foreground">
              Start your first walk
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your stats will appear here after your first Perfect Walk
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Stats;
