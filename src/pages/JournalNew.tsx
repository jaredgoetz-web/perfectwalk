import { useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateWalkEntry, moodEmoji } from "@/lib/walkStore";

const moods = [
  { key: "amazing", emoji: "✨", label: "Amazing" },
  { key: "great", emoji: "🌟", label: "Great" },
  { key: "good", emoji: "☀️", label: "Good" },
  { key: "neutral", emoji: "🌤️", label: "Neutral" },
  { key: "tough", emoji: "🌧️", label: "Tough" },
] as const;

const prompts = [
  "What did you feel during your walk today?",
  "What are you grateful for this morning?",
  "What insight came to you while walking?",
  "How do you want to show up today?",
];

const JournalNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const walkId = searchParams.get("walkId");
  const [mood, setMood] = useState<string>("");
  const [journal, setJournal] = useState("");
  const [prompt] = useState(() => prompts[Math.floor(Math.random() * prompts.length)]);

  const handleSave = () => {
    if (walkId) {
      updateWalkEntry(walkId, {
        mood: mood as any,
        journalEntry: journal || undefined,
      });
    }
    navigate("/journal");
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="flex items-center gap-3 px-5 pt-5">
        <button
          onClick={() => navigate("/journal")}
          className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-semibold text-foreground">
          Post-Walk Reflection
        </h1>
      </div>

      <div className="mx-auto max-w-lg px-5">
        {/* Congrats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 rounded-2xl gradient-sunrise p-6 text-center text-primary-foreground"
        >
          <p className="text-4xl">🎉</p>
          <p className="mt-2 font-display text-2xl font-bold">Walk Complete!</p>
          <p className="mt-1 text-sm opacity-90">
            You showed up for yourself this morning. That's everything.
          </p>
        </motion.div>

        {/* Mood */}
        <div className="mt-8">
          <p className="font-display text-lg font-semibold text-foreground">
            How are you feeling?
          </p>
          <div className="mt-3 flex gap-2">
            {moods.map((m) => (
              <button
                key={m.key}
                onClick={() => setMood(m.key)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 transition-all ${
                  mood === m.key
                    ? "bg-primary/10 ring-2 ring-primary/40"
                    : "bg-card hover:bg-secondary"
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Journal */}
        <div className="mt-8">
          <p className="font-display text-lg font-semibold text-foreground">{prompt}</p>
          <Textarea
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="Share your experience..."
            className="mt-3 min-h-[140px] resize-none rounded-xl border-border bg-card text-foreground"
          />
        </div>

        {/* Save */}
        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/journal")}
            className="flex-1 rounded-full"
          >
            Skip
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
          >
            <Check className="h-4 w-4" />
            Save Reflection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JournalNew;
