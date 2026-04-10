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
    id: "philosophy-feeling",
    title: "The Mind Is a Tool to Get to the Feeling",
    description: "The key concept that deepens your entire practice",
    readTime: "2 min",
    category: "The Philosophy",
    content: `Here's the key to everything: you can use your mind as an anchor point to get into these feelings. But once you start feeling, that's when you let go of attachment to your mind and focus on the feeling itself.

By focusing on the feeling, you put your energy into the feeling, and the feeling grows. So you don't actually need your mind to feel these feelings. You can use your mind as a reference point to get there.

For example, if you want to feel love or gratitude, you may use your mind to think of a family member or a pet. But once you feel that feeling of love or gratitude, your mind is no longer needed. You focus on that feeling and let it build.

That's the same for all parts of this walk. Where you focus your attention and your energy is what continues to manifest and grow. Your mind is a tool to get to the feeling. Once the feeling is there, you can ditch the mind and focus on the feeling.

This one concept will transform your entire practice. Master it, and every walk goes deeper.`,
  },
  {
    id: "philosophy-experience",
    title: "Words Are Limiting. Experience Is Limitless.",
    description: "Why doing the walk matters a thousand times more than reading about it",
    readTime: "2 min",
    category: "The Philosophy",
    content: `When you read something and comprehend it, your mind understands it. But when you take action and do something and experience the outcome, your soul understands it.

The Perfect Walk leads you to a place where you can have these experiences regularly, and they will continue to teach you deep in your soul. The experience will deepen as you practice more, and the lessons will keep coming. They'll come at a grander scale and build on top of each other.

You'll learn something through one experience and be able to learn another thing only because you had the first experience that taught you what you needed. That's why practice matters. That's why consistency matters.

You may read these words and say "I understand this already." But once you have your first click moment, you'll realize the levels of deepness go so much deeper than through reading. The difference between understanding conceptually and experiencing through doing is a thousandfold. It's not even close.`,
  },
  {
    id: "philosophy-giant",
    title: "The Giant Inside You",
    description: "There's an all-powerful being inside you that's ready to wake up",
    readTime: "3 min",
    category: "The Philosophy",
    content: `There's a giant inside each and every one of us. This giant is shackled by the bounds of life. It's shackled by our minds focused consistently on our problems and the numbing of our problems with actions that don't align with our true purpose. This giant is held behind the bar of scrolling on your phone. It's shackled up by taking the bite of that food you know is not good for you. And it's tranquilized and kept behind bars.

But it's in there and it's ready to come out. This giant inside of you is meant to make an impact on the world. It's meant to be set free. It's meant to explode with energy on a daily basis.

When you can awaken this giant, there's nothing that can stop your truest dreams and desires. You become bulletproof. You become the person you could only dream of in the past. Fears and obstacles become just another thing to deal with. They don't cripple you.

This power is compounding. Next time you go on a walk, you're going to feel it five times more. The next time, ten times more. Then a hundred times more. You're going to get exponentially more powerful every single time you take this walk. When you combine this feeling with love, there is no stopping you from fulfilling your purpose.`,
  },
  {
    id: "identity-repetition",
    title: "The More You Practice, The Deeper It Gets",
    description: "Why every single day matters and how the lessons build on each other",
    readTime: "2 min",
    category: "The Practice",
    content: `The walk is best done first thing in the morning. Right when you get up, drink some water, maybe a little coffee, and get out of the house before your mind turns on and starts to convince you to do other things.

You set the stage for your day. For who you're going to be that day, for what you're going to feel like, for what you're going to give out to the universe, and for what you're going to receive. You create the energetic code of what your life will become, because everything you feel during this walk will be attracted to you afterwards.

Do it every single day. The more you do the walk, the deeper your practice becomes, the faster things will change in your life. You'll be able to build on the feelings from your last walk. You'll find the feeling easier and go deeper with more time in it.

When you look for it and search for it and try, you won't find. But when you let go and be present and follow the cues, you'll find. And if you've done the walk yesterday, it's much easier to find the feeling. So every day is recommended.

The perfect walk is such a simple habit yet so powerful that once you get started, you'll never stop.`,
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
