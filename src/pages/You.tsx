import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  BarChart3,
  BookOpen,
  Headphones,
  ChevronRight,
  Flame,
  TrendingUp,
  Clock,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getStreak, getTotalWalks, getTotalMinutes, getWalkEntries } from "@/lib/walkStore";

const You = () => {
  const navigate = useNavigate();
  const [futureSelf, setFutureSelf] = useState(
    () => localStorage.getItem("tpw_future_self") || "",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(futureSelf);

  const streak = getStreak();
  const totalWalks = getTotalWalks();
  const totalMinutes = getTotalMinutes();
  const entries = getWalkEntries();

  // Recurring truths from journal entries
  const recentTruths = entries
    .filter((e) => e.journalEntry)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleSaveFutureSelf = () => {
    localStorage.setItem("tpw_future_self", editText);
    setFutureSelf(editText);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-lg px-5 pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">You</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your identity, your practice, your growth
          </p>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 grid grid-cols-3 gap-3"
        >
          {[
            { icon: Flame, value: streak, label: "Streak", color: "text-accent" },
            { icon: TrendingUp, value: totalWalks, label: "Walks", color: "text-primary" },
            { icon: Clock, value: totalMinutes, label: "Minutes", color: "text-warm-glow" },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-card px-3 py-4 shadow-warm">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="font-display text-xl font-bold text-foreground">{value}</span>
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Future Self */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-xl bg-card p-5 shadow-warm"
        >
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold text-foreground">
              Who I Am Becoming
            </p>
            {!isEditing && (
              <button
                onClick={() => {
                  setEditText(futureSelf);
                  setIsEditing(true);
                }}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="mt-3">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="I am someone who..."
                className="min-h-[80px] resize-none rounded-xl border-border bg-background text-foreground"
                autoFocus
              />
              <div className="mt-2 flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveFutureSelf}
                  className="rounded-full p-1.5 text-primary hover:bg-primary/10"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : futureSelf ? (
            <p className="mt-3 text-sm italic leading-relaxed text-foreground/80">
              "{futureSelf}"
            </p>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Write your future self statement...
            </button>
          )}
        </motion.div>

        {/* Recurring Truths */}
        {recentTruths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-xl bg-card p-5 shadow-warm"
          >
            <p className="font-display text-lg font-semibold text-foreground">
              Truths I Keep Rediscovering
            </p>
            <p className="mt-1 text-xs text-muted-foreground">From your walk reflections</p>
            <div className="mt-4 space-y-3">
              {recentTruths.map((entry) => (
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

        {/* Navigation links */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-2"
        >
          {[
            { icon: BarChart3, label: "Detailed Stats", desc: "Heatmap, phase frequency, mood trends", to: "/stats" },
            { icon: Headphones, label: "Learn", desc: "Lessons on the philosophy and practice", to: "/learn" },
          ].map(({ icon: Icon, label, desc, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-warm text-left transition-all hover:shadow-elevated"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default You;
