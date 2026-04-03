import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Headphones, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  audioSrc: string;
}

const lessons: Lesson[] = [
  {
    id: "intro",
    title: "Introduction to The Perfect Walk",
    description:
      "Learn the foundations of the five-phase walking practice and how it transforms your mornings.",
    duration: "3 min",
    audioSrc: "/audio/intro-lesson.mp3",
  },
];

const Learn = () => {
  const [playing, setPlaying] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [listened, setListened] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("tpw_listened");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (lesson: Lesson) => {
    if (playing === lesson.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(lesson.audioSrc);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress((p) => ({ ...p, [lesson.id]: pct }));
        if (pct > 80) {
          setListened((prev) => {
            const next = new Set(prev).add(lesson.id);
            localStorage.setItem("tpw_listened", JSON.stringify([...next]));
            return next;
          });
        }
      }
    });

    audio.addEventListener("ended", () => {
      setPlaying(null);
      setProgress((p) => ({ ...p, [lesson.id]: 100 }));
      setListened((prev) => {
        const next = new Set(prev).add(lesson.id);
        localStorage.setItem("tpw_listened", JSON.stringify([...next]));
        return next;
      });
    });

    audio.play();
    setPlaying(lesson.id);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-5 pb-8 pt-12">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Headphones className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Learn</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Deepen your understanding of The Perfect Walk through guided audio lessons.
          </p>
        </div>
      </div>

      {/* Lessons */}
      <div className="mx-auto max-w-lg px-5 mt-4 space-y-4">
        {lessons.map((lesson, i) => {
          const isPlaying = playing === lesson.id;
          const pct = progress[lesson.id] || 0;
          const done = listened.has(lesson.id);

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
            >
              {/* Progress bar */}
              <div className="h-1 w-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="p-5">
                <div className="flex items-start gap-4">
                  <Button
                    size="icon"
                    onClick={() => togglePlay(lesson)}
                    className="mt-0.5 h-12 w-12 shrink-0 rounded-full shadow-warm"
                    style={{
                      background: isPlaying
                        ? "hsl(var(--primary))"
                        : "linear-gradient(135deg, hsl(38 90% 55%), hsl(28 85% 50%))",
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-primary-foreground" />
                    ) : (
                      <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {lesson.title}
                      </h3>
                      {done && <CheckCircle className="h-4 w-4 shrink-0 text-primary" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {lesson.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {lesson.duration}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Coming soon */}
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">More lessons coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default Learn;
