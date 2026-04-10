import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Headphones, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  audioSrc: string;
}

interface WrittenLesson {
  id: string;
  title: string;
  description: string;
  readTime: string;
  category: string;
  content: string;
}

const audioLessons: AudioLesson[] = [
  {
    id: "intro",
    title: "Introduction to The Perfect Walk",
    description:
      "Learn the foundations of the five-phase walking practice and how it transforms your mornings.",
    duration: "3 min",
    audioSrc: "/audio/intro-lesson.mp3",
  },
];

const writtenLessons: WrittenLesson[] = [
  {
    id: "philosophy-state",
    title: "State Is Everything",
    description: "Why your emotional state matters more than your to-do list",
    readTime: "2 min",
    category: "The Philosophy",
    content: `Most people wake up and immediately check their phone. Before they've taken a single conscious breath, their emotional state has been hijacked by notifications, news, and other people's agendas.

The Perfect Walk exists because of one core truth: your emotional state determines the quality of your decisions, your relationships, your creativity, and your presence. Not your plans. Not your productivity system. Your state.

When you feel contracted — anxious, reactive, defensive — you see threats everywhere. You play small. You make fear-based decisions. When you feel expanded — open, grounded, connected — you see possibility. You act from wisdom instead of reaction.

This is not positive thinking. This is physics. Your nervous system literally filters reality based on your emotional state. A 25-minute walk that shifts your state from contraction to expansion changes the entire trajectory of your day.

The walk doesn't add something to your life. It removes the static that was already blocking what's true.`,
  },
  {
    id: "philosophy-mind",
    title: "The Mind Is Not the Enemy",
    description: "How to work with your thoughts instead of against them",
    readTime: "2 min",
    category: "The Philosophy",
    content: `Your mind is not the problem. Your relationship to your mind is.

The mind does what minds do: it analyzes, projects, worries, plans. It replays the past and rehearses the future. This is its job. It's a survival tool, a pattern-recognition machine, and it's very good at what it does.

The problem starts when you believe everything it says. When you mistake the voice in your head for the truth. When the guard dog starts running the household.

During The Perfect Walk, you learn to use your mind as a tool rather than being used by it. In Phase 1, you use a thought — a person you love, a memory of gratitude — as an anchor to access a feeling. Then you release the thought and stay with the feeling. The feeling grows on its own when you give it space.

This is the core skill: use the mind to reach the feeling, then let the mind rest. Over time, you'll notice something remarkable — the gap between thoughts gets wider. Intuition gets louder. The noise fades. What remains is clarity.`,
  },
  {
    id: "intuition-listen",
    title: "Listening to What You Already Know",
    description: "Your intuition speaks quieter than fear, but it's always more accurate",
    readTime: "3 min",
    category: "Intuition",
    content: `Everyone has experienced intuition. A knowing that arrived before the evidence. A feeling about a person that proved right. A decision that made no logical sense but turned out to be exactly correct.

Intuition is not mystical. It's a deeper form of intelligence that processes far more information than your conscious mind can hold. It speaks through the body — a gut feeling, a tightness in the chest, a sudden calm. It rarely explains itself. It just knows.

The challenge is that fear also speaks through the body. So how do you tell the difference?

Fear is loud, urgent, and repetitive. It says the same thing over and over. It contracts your body. It demands immediate action. It catastrophizes.

Intuition is quiet, clear, and often surprising. It doesn't argue. It states once and waits. It might make you uncomfortable, but it doesn't make you panicked. There's a settledness to it, even when the message is hard.

Phase 3 of the walk — Connecting with Source — is where intuition speaks loudest. When you've already opened your heart, activated your power, and then surrender control, what remains is signal. The noise is gone. What comes through in that silence is worth trusting.

The walk trains you to hear this voice more clearly every day. Not by adding something new, but by removing what was covering it up.`,
  },
  {
    id: "identity-repetition",
    title: "The Power of Repetition",
    description: "Why the 100th walk matters more than the first",
    readTime: "2 min",
    category: "Identity",
    content: `Your first Perfect Walk might feel powerful. Or it might feel awkward. It doesn't matter.

What matters is that you showed up. And what matters even more is that you show up again tomorrow. And the day after that.

Transformation is not a single moment of insight. It's the compound effect of small, consistent shifts in state. Each walk doesn't need to be transcendent. It needs to happen.

Think of it like this: one walk opens a door. Ten walks create a path. A hundred walks become who you are. You stop being someone who does a walking practice and become someone who walks. The practice becomes identity.

This is why Phase 5 — Celebration — matters so much. It encodes the walk as rewarding. Your brain starts associating the practice with joy, pride, and gratitude. Over time, the walk stops feeling like discipline and starts feeling like coming home.

The streak counter in this app isn't a gamification trick. It's a mirror. It shows you who you're becoming through the simple act of showing up. Every morning you walk is a vote for the person you want to be.`,
  },
];

const categories = [...new Set(writtenLessons.map((l) => l.category))];

const Learn = () => {
  const [playing, setPlaying] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [listened, setListened] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("tpw_listened");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (lesson: AudioLesson) => {
    if (playing === lesson.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();

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
            Deepen your understanding of the practice and its philosophy.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 mt-4">
        {/* Audio lessons */}
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Audio Lessons
          </p>
          {audioLessons.map((lesson, i) => {
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
        </div>

        {/* Written lessons by category */}
        {categories.map((category) => (
          <div key={category} className="mt-8">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {category}
            </p>
            <div className="mt-3 space-y-3">
              {writtenLessons
                .filter((l) => l.category === category)
                .map((lesson, i) => {
                  const isExpanded = expanded === lesson.id;
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="overflow-hidden rounded-xl bg-card shadow-warm"
                    >
                      <button
                        onClick={() => setExpanded(isExpanded ? null : lesson.id)}
                        className="flex w-full items-start gap-3 p-4 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-base font-semibold text-foreground">
                            {lesson.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {lesson.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {lesson.readTime} read
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 shrink-0 mt-1 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 mt-1 text-muted-foreground" />
                        )}
                      </button>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-t border-border px-4 py-4"
                        >
                          {lesson.content.split("\n\n").map((para, j) => (
                            <p
                              key={j}
                              className="text-sm leading-relaxed text-foreground/85 mb-3 last:mb-0"
                            >
                              {para}
                            </p>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Learn;
