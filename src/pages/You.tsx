import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Headphones,
  ChevronRight,
  Flame,
  TrendingUp,
  Clock,
  Edit3,
  Check,
  X,
} from "lucide-react";
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm text-muted-foreground">Day {totalWalks} of your practice</p>
        </motion.div>

        {/* Future Self — THE centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mt-6"
        >
          {isEditing ? (
            <div className="rounded-2xl bg-card p-6 shadow-warm">
              <p className="text-xs font-medium text-muted-foreground mb-3">Who I Am Becoming</p>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="I am someone who..."
                className="min-h-[100px] resize-none rounded-xl border-border bg-background text-foreground font-display text-lg leading-relaxed"
                autoFocus
              />
              <div className="mt-3 flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveFutureSelf}
                  className="rounded-full p-2 text-primary hover:bg-primary/10"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : futureSelf ? (
            <button
              onClick={() => { setEditText(futureSelf); setIsEditing(true); }}
              className="w-full text-left group"
            >
              <p className="font-display text-2xl font-bold leading-relaxed text-foreground">
                "{futureSelf}"
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                <Edit3 className="h-3 w-3" />
                <span className="text-xs">Edit</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full rounded-2xl border-2 border-dashed border-border/50 p-8 text-center hover:border-primary/30 transition-colors"
            >
              <p className="font-display text-xl font-semibold text-foreground/50">
                Who are you becoming?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Write your identity statement
              </p>
            </button>
          )}
        </motion.div>

        {/* Stats — compact, below the fold */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-3"
        >
          {[
            { icon: Flame, value: streak, label: streak === 1 ? "day" : "days", color: "text-accent" },
            { icon: TrendingUp, value: totalWalks, label: "walks", color: "text-primary" },
            { icon: Clock, value: totalMinutes, label: "min", color: "text-warm-glow" },
          ].map(({ icon: Icon, value, label, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-card px-3 py-4 shadow-soft"
            >
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="font-display text-xl font-bold text-foreground">{value}</span>
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Recurring Truths */}
        {recentTruths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Truths from your walks
            </p>
            <div className="mt-4 space-y-4">
              {recentTruths.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                  className="border-l-2 border-primary/20 pl-4"
                >
                  <p className="font-display text-sm italic leading-relaxed text-foreground/70">
                    "{entry.journalEntry}"
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/50">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-10 space-y-2"
        >
          {[
            { icon: BarChart3, label: "Detailed Stats", to: "/stats" },
            { icon: Headphones, label: "Learn", to: "/learn" },
          ].map(({ icon: Icon, label, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-soft text-left card-hover"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default You;
