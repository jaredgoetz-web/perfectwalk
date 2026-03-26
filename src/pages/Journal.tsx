import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Flame } from "lucide-react";
import { getWalkEntries, moodEmoji } from "@/lib/walkStore";
import { format } from "date-fns";

const Journal = () => {
  const entries = getWalkEntries().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-lg px-5 pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Journal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reflect on your walks and track your inner journey
          </p>
        </motion.div>

        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-16 flex flex-col items-center text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 font-display text-xl font-semibold text-foreground">
              No walks yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your first Perfect Walk to start journaling
            </p>
          </motion.div>
        ) : (
          <div className="mt-6 space-y-3">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card p-4 shadow-warm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-semibold text-foreground">
                    {format(new Date(entry.date), "EEEE, MMM d")}
                  </p>
                  {entry.mood && (
                    <span className="text-xl">{moodEmoji[entry.mood]}</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {entry.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" />
                    {entry.completedPhases.length}/5 phases
                  </span>
                </div>
                {entry.journalEntry && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                    {entry.journalEntry}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
