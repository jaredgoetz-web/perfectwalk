import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, Pause, Mail, ArrowRight, X, CheckCircle, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step =
  | "welcome"
  | "read-yes-videos"
  | "read-no"
  | "videos"
  | "listen"
  | "email-sent";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const INTRO_VIDEOS = [
  { title: "What is The Perfect Walk?", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { title: "The Five Phases Explained", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
];

const fadeSlide = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35 },
};

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<Step>("welcome");
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/intro-lesson.mp3");
      audioRef.current.addEventListener("ended", () => setIsAudioPlaying(false));
    }
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: wire up actual email sending
    setEmailSubmitted(true);
    setTimeout(() => setStep("videos"), 1800);
  };

  const handleFinish = () => {
    localStorage.setItem("tpw_onboarded", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <button
        onClick={handleFinish}
        className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          {/* ─── Welcome ─── */}
          {step === "welcome" && (
            <motion.div key="welcome" {...fadeSlide} className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-sunrise shadow-warm">
                <BookOpen className="h-9 w-9 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  Welcome to<br />The Perfect Walk
                </h1>
                <p className="mt-3 text-muted-foreground">
                  Have you read <span className="font-semibold text-foreground">The Perfect Walk</span> book?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={() => setStep("read-yes-videos")}
                  className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
                >
                  Yes, I've read it
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setStep("read-no")}
                  className="w-full rounded-full"
                >
                  Not yet
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Read Yes → Video choice ─── */}
          {step === "read-yes-videos" && (
            <motion.div key="read-yes" {...fadeSlide} className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <Play className="h-9 w-9 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Great to have you!
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Would you like to watch the intro videos before your first walk?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={() => setStep("videos")}
                  className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
                >
                  Sure, a refresher sounds good
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleFinish}
                  className="w-full rounded-full"
                >
                  Nope, I'm ready to walk!
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Read No → Email + Amazon ─── */}
          {step === "read-no" && (
            <motion.div key="read-no" {...fadeSlide} className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <Mail className="h-9 w-9 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  We highly recommend it
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  The book will give you the deepest understanding of this practice. You can{" "}
                  <a
                    href="https://www.amazon.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    get it on Amazon
                  </a>
                  , or enter your email and we'll send you a free digital copy.
                </p>
              </div>

              {!emailSubmitted ? (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full rounded-full border border-input bg-card px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
                  >
                    <Mail className="h-4 w-4" />
                    Send Me the Book
                  </Button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 rounded-full bg-[hsl(141,70%,38%)]/10 px-4 py-3 text-sm font-medium text-[hsl(141,70%,38%)]"
                >
                  <CheckCircle className="h-4 w-4" />
                  Check your inbox! Redirecting to intro videos…
                </motion.div>
              )}

              {!emailSubmitted && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    In the meantime, here are the intro videos:
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setStep("videos")}
                    className="w-full gap-2 rounded-full"
                  >
                    <Play className="h-4 w-4" />
                    Watch Intro Videos
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Videos ─── */}
          {step === "videos" && (
            <motion.div key="videos" {...fadeSlide} className="space-y-5">
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Intro Videos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get familiar with the five phases
                </p>
              </div>

              <div className="space-y-4">
                {INTRO_VIDEOS.map((video, i) => (
                  <div key={i} className="overflow-hidden rounded-xl shadow-elevated">
                    <div className="aspect-video">
                      <iframe
                        src={video.url}
                        title={video.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="bg-card px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">{video.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => setStep("listen")}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
              >
                One More Thing…
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ─── Listen to Intro Audio ─── */}
          {step === "listen" && (
            <motion.div key="listen" {...fadeSlide} className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
                <Headphones className="h-9 w-9 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Listen Before You Walk
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  This short audio introduction will set the tone for your very first walk. We highly recommend it.
                </p>
              </div>

              <button
                onClick={toggleAudio}
                className="mx-auto flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-elevated transition-all hover:shadow-warm"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-warm"
                  style={{ background: "linear-gradient(135deg, hsl(38 90% 55%), hsl(28 85% 50%))" }}
                >
                  {isAudioPlaying ? (
                    <Pause className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Introduction to The Perfect Walk</p>
                  <p className="text-xs text-muted-foreground">Tap to {isAudioPlaying ? "pause" : "listen"}</p>
                </div>
              </button>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleFinish}
                  className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
                >
                  I'm Ready to Walk
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  You can always find this and more lessons in the <span className="font-semibold text-foreground">Learn</span> tab.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingFlow;
