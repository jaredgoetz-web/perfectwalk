import { motion } from "framer-motion";
import { Flame, TrendingUp, Clock, Calendar, Heart, Zap, Leaf, Sparkles, PartyPopper } from "lucide-react";
import { getStreak, getTotalWalks, getTotalMinutes, getWalkEntries, moodEmoji } from "@/lib/walkStore";

const phaseNames: Record<number, { label: string; icon: typeof Flame; color: string }> = {
  1: { label: "Heart", icon: Heart, color: "text-dawn-rose" },
  2: { label: "Power", icon: Zap, color: "text-warm-glow" },
  3: { label: "Connection", icon: Sparkles, color: "text-sky-lavender" },
  4: { label: "Presence", icon: Leaf, color: "text-sage-green" },
  5: { label: "Celebration", icon: PartyPopper, color: "text-primary" },
};

const Stats = () => {
  const streak = getStreak();
  const totalWalks = getTotalWalks();
  const totalMinutes = getTotalMinutes();
  const entries = getWalkEntries();

  // Mood counts
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

  // Phase completion frequency
  const phaseCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach((e) => {
    e.completedPhases.forEach((p) => {
      if (phaseCounts[p] !== undefined) phaseCounts[p]++;
    });
  });
  const maxPhaseCount = Math.max(...Object.values(phaseCounts), 1);

  // 30-day heatmap
  const today = new Date();
  const thirtyDays: { date: Date; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = entries.filter((e) => e.date.slice(0, 10) === dateStr).length;
    thirtyDays.push({ date: d, count });
  }

  // Recent journal insights (last 5 entries with journal text)
  const recentInsights = entries
    .filter((e) => e.journalEntry)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
                className="rounded-2xl bg-card p-5 shadow-warm"
              >
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <p className="mt-3 font-display text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.unit}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* 30-day consistency heatmap */}
        {totalWalks > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 rounded-2xl bg-card p-5 shadow-warm"
          >
            <p className="font-display text-lg font-semibold text-foreground">
              30-Day Consistency
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Your walk rhythm</p>
            <div className="mt-4 grid grid-cols-10 gap-1.5">
              {thirtyDays.map(({ date, count }, i) => (
                <div
                  key={i}
                  title={`${date.toLocaleDateString()} — ${count} walk${count !== 1 ? "s" : ""}`}
                  className={`aspect-square rounded-sm transition-colors ${
                    count === 0
                      ? "bg-secondary"
                      : count === 1
                      ? "bg-primary/30"
                      : count === 2
                      ? "bg-primary/60"
                      : "bg-primary"
                  }`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-sm bg-secondary" />
              <div className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
              <div className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
              <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
              <span>More</span>
            </div>
          </motion.div>
        )}

        {/* Phase completion frequency */}
        {totalWalks > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 rounded-2xl bg-card p-5 shadow-warm"
          >
            <p className="font-display text-lg font-semibold text-foreground">
              Phase Frequency
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Which phases you complete most</p>
            <div className="mt-4 space-y-3">
              {Object.entries(phaseNames).map(([id, { label, icon: PhaseIcon, color }]) => {
                const count = phaseCounts[Number(id)] || 0;
                const pct = (count / maxPhaseCount) * 100;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <PhaseIcon className={`h-4 w-4 shrink-0 ${color}`} />
                    <span className="w-20 text-xs font-medium text-foreground">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="h-full rounded-full bg-primary/70"
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Top mood */}
        {topMood && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex items-center gap-4 rounded-2xl bg-card p-5 shadow-warm"
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

        {/* Recent insights */}
        {recentInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4 rounded-2xl bg-card p-5 shadow-warm"
          >
            <p className="font-display text-lg font-semibold text-foreground">
              Recent Insights
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Truths from your walks</p>
            <div className="mt-4 space-y-3">
              {recentInsights.map((entry) => (
                <div key={entry.id} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-sm italic leading-relaxed text-foreground/80">
                    "{entry.journalEntry}"
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
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
