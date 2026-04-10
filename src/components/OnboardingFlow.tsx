import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Heart, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Step =
  | "welcome"
  | "seeking"
  | "obstacles"
  | "language"
  | "guidance"
  | "intention"
  | "begin";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const seekingOptions = [
  "More peace",
  "More clarity",
  "More confidence",
  "Stronger intuition",
  "Healing",
  "More purpose",
];

const obstacleOptions = [
  "Overthinking",
  "Numbness",
  "Anxiety",
  "Inconsistency",
  "Low energy",
  "Disconnection",
];

const languageOptions = [
  "God",
  "Source",
  "Universe",
  "Higher Self",
  "Truth",
  "No preference",
];

const guidanceOptions = [
  { key: "voice", label: "Voice-forward", desc: "Rich guidance during your walk" },
  { key: "music", label: "Music-forward", desc: "Minimal prompts, more music" },
  { key: "silence", label: "Mostly silence", desc: "Space to be with yourself" },
];

const fadeSlide = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35 },
};

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<Step>("welcome");
  const [seeking, setSeeking] = useState<string[]>([]);
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [guidance, setGuidance] = useState("");
  const [intention, setIntention] = useState("");

  const toggleMulti = (
    value: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  };

  const handleFinish = () => {
    const answers = {
      seeking,
      obstacles,
      spiritualLanguage: language,
      guidanceStyle: guidance,
      intention,
    };
    localStorage.setItem("tpw_onboarding_answers", JSON.stringify(answers));
    localStorage.setItem("tpw_spiritual_language", language || "Truth");
    localStorage.setItem("tpw_onboarded", "true");
    onComplete();
  };

  const steps: Step[] = [
    "welcome",
    "seeking",
    "obstacles",
    "language",
    "guidance",
    "intention",
    "begin",
  ];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <button
        onClick={handleFinish}
        className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Progress bar */}
      <div className="absolute top-14 left-6 right-6">
        <div className="h-1 rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          {/* ─── Welcome ─── */}
          {step === "welcome" && (
            <motion.div key="welcome" {...fadeSlide} className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-sunrise shadow-warm">
                <Sun className="h-9 w-9 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  This is not just a walking app.
                </h1>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  This is a daily practice to help you open, connect, and become more aligned.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setStep("seeking")}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
              >
                Begin
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ─── What Are You Seeking ─── */}
          {step === "seeking" && (
            <motion.div key="seeking" {...fadeSlide} className="space-y-6">
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  What are you seeking?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose everything that resonates.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {seekingOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => toggleMulti(opt, seeking, setSeeking)}
                    className={`rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${
                      seeking.includes(opt)
                        ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                        : "bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Button
                size="lg"
                onClick={() => setStep("obstacles")}
                disabled={seeking.length === 0}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ─── Obstacles ─── */}
          {step === "obstacles" && (
            <motion.div key="obstacles" {...fadeSlide} className="space-y-6">
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  What gets in your way?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  No judgment. Just awareness.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {obstacleOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => toggleMulti(opt, obstacles, setObstacles)}
                    className={`rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${
                      obstacles.includes(opt)
                        ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                        : "bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Button
                size="lg"
                onClick={() => setStep("language")}
                disabled={obstacles.length === 0}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ─── Spiritual Language ─── */}
          {step === "language" && (
            <motion.div key="language" {...fadeSlide} className="space-y-6">
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  What language feels right?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We'll use this word when guiding your walk.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {languageOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLanguage(opt)}
                    className={`rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${
                      language === opt
                        ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                        : "bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Button
                size="lg"
                onClick={() => setStep("guidance")}
                disabled={!language}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ─── Guidance Style ─── */}
          {step === "guidance" && (
            <motion.div key="guidance" {...fadeSlide} className="space-y-6">
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  How would you like to be guided?
                </h2>
              </div>
              <div className="space-y-3">
                {guidanceOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setGuidance(opt.key)}
                    className={`flex w-full flex-col items-start rounded-xl px-5 py-4 text-left transition-all ${
                      guidance === opt.key
                        ? "bg-primary/10 ring-2 ring-primary/30"
                        : "bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className={`text-sm font-semibold ${guidance === opt.key ? "text-primary" : "text-foreground"}`}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
              <Button
                size="lg"
                onClick={() => setStep("intention")}
                disabled={!guidance}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ─── First Intention ─── */}
          {step === "intention" && (
            <motion.div key="intention" {...fadeSlide} className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
                  Set your first intention
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  What would you love this practice to help you become?
                </p>
              </div>
              <Textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="I want to become someone who..."
                className="min-h-[100px] resize-none rounded-xl border-border bg-card text-foreground"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("begin")}
                  className="flex-1 rounded-full"
                >
                  Skip
                </Button>
                <Button
                  size="lg"
                  onClick={() => setStep("begin")}
                  className="flex-1 gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Let's Begin ─── */}
          {step === "begin" && (
            <motion.div key="begin" {...fadeSlide} className="space-y-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-sunrise shadow-warm">
                <Sparkles className="h-9 w-9 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground">
                  You're ready.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Every walk is a chance to open, connect, and become more of who you already are.
                </p>
                <p className="mt-3 text-sm text-muted-foreground italic">
                  Show up. Feel everything. Trust what comes.
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleFinish}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
              >
                Start My First Walk
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingFlow;
