import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "welcome" | "language-intro" | "language" | "begin";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const languageOptions = [
  "God",
  "Source",
  "Universe",
  "Higher Self",
  "Truth",
  "No preference",
];

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
};

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<Step>("welcome");
  const [language, setLanguage] = useState("");

  const handleFinish = () => {
    localStorage.setItem("tpw_spiritual_language", language || "Truth");
    localStorage.setItem("tpw_onboarded", "true");
    onComplete();
  };

  const steps: Step[] = ["welcome", "language-intro", "language", "begin"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background overflow-y-auto">
      <button
        onClick={handleFinish}
        className="absolute right-4 top-4 z-20 rounded-full p-2 text-muted-foreground/40 hover:text-muted-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Progress dots */}
      <div className="absolute top-14 left-0 right-0 flex justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= stepIndex ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-md px-8">
        <AnimatePresence mode="wait">
          {/* ─── Welcome ─── */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              {...fadeSlide}
              className="fixed inset-0 flex flex-col items-center justify-between overflow-hidden"
              style={{ background: "hsl(30 30% 97%)" }}
            >
              {/* ── Layered animated background ── */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Base warm radial wash */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 120% 80% at 50% 110%, hsla(38,90%,55%,0.18) 0%, hsla(20,70%,70%,0.10) 40%, transparent 70%)",
                  }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Upper peach glow */}
                <motion.div
                  className="absolute -top-[20%] left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, hsla(20,70%,70%,0.12) 0%, transparent 70%)",
                  }}
                  animate={{ scale: [1, 1.08, 1], y: [0, 12, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Floating orb — large, left */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 280,
                    height: 280,
                    top: "15%",
                    left: "-8%",
                    background:
                      "radial-gradient(circle, hsla(38,90%,55%,0.10) 0%, hsla(350,40%,65%,0.05) 50%, transparent 70%)",
                    filter: "blur(40px)",
                  }}
                  animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Floating orb — small, right */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 180,
                    height: 180,
                    top: "60%",
                    right: "-5%",
                    background:
                      "radial-gradient(circle, hsla(350,40%,65%,0.10) 0%, hsla(270,30%,70%,0.05) 50%, transparent 70%)",
                    filter: "blur(30px)",
                  }}
                  animate={{ x: [0, -18, 0], y: [0, 12, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />

                {/* Subtle light rays from bottom center */}
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2"
                  style={{
                    width: "140%",
                    height: "45%",
                    background:
                      "conic-gradient(from 260deg at 50% 100%, transparent 0deg, hsla(38,90%,55%,0.04) 15deg, transparent 30deg, hsla(20,70%,70%,0.03) 50deg, transparent 65deg, hsla(38,90%,55%,0.04) 80deg, transparent 100deg, transparent 360deg)",
                  }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* ── Central content ── */}
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 text-center">
                {/* Luminous ring / sunrise symbol */}
                <motion.div
                  className="relative mb-16"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Outer glow haze */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      width: 140,
                      height: 140,
                      margin: "-20px",
                      background:
                        "radial-gradient(circle, hsla(38,90%,55%,0.15) 0%, hsla(20,70%,70%,0.08) 40%, transparent 70%)",
                      filter: "blur(20px)",
                    }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Gradient ring */}
                  <motion.div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background:
                        "conic-gradient(from 180deg, hsla(38,90%,55%,0.8), hsla(20,70%,70%,0.6), hsla(350,40%,65%,0.5), hsla(270,30%,70%,0.3), hsla(38,90%,55%,0.8))",
                      padding: 2,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  >
                    <div
                      className="h-full w-full rounded-full"
                      style={{ background: "hsl(30 30% 97%)" }}
                    />
                  </motion.div>

                  {/* Inner warm dot */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: 12,
                      height: 12,
                      background:
                        "radial-gradient(circle, hsla(38,90%,60%,0.9) 0%, hsla(38,90%,55%,0.3) 70%, transparent 100%)",
                    }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>

                {/* Title */}
                <motion.h1
                  className="font-display text-foreground"
                  style={{
                    fontSize: "clamp(2.4rem, 10vw, 3.2rem)",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  The Perfect
                  <br />
                  Walk
                </motion.h1>

                {/* Thin gold divider */}
                <motion.div
                  className="mx-auto mt-8 mb-8 rounded-full"
                  style={{
                    width: 48,
                    height: 1.5,
                    background:
                      "linear-gradient(90deg, transparent, hsla(38,90%,55%,0.6), transparent)",
                  }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Body copy */}
                <motion.p
                  className="font-body text-muted-foreground max-w-[280px] leading-[1.7]"
                  style={{ fontSize: "0.95rem" }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  A sacred morning ritual that awakens your
                  body, quiets your mind, and turns you into
                  a magnetic force.
                </motion.p>

                {/* Italic whisper */}
                <motion.p
                  className="font-display mt-6 italic"
                  style={{
                    fontSize: "0.85rem",
                    color: "hsla(25,25%,12%,0.35)",
                    letterSpacing: "0.01em",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.1 }}
                >
                  Words are limiting. Experience is limitless.
                </motion.p>
              </div>

              {/* ── Bottom CTA area ── */}
              <motion.div
                className="relative z-10 w-full px-8 pt-4"
                style={{ paddingBottom: "max(3.5rem, env(safe-area-inset-bottom, 2rem) + 1.5rem)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.button
                  onClick={() => setStep("language-intro")}
                  className="group relative mx-auto flex w-full max-w-xs items-center justify-center overflow-hidden rounded-full px-8 py-4 font-body font-medium tracking-wide"
                  style={{
                    fontSize: "0.95rem",
                    color: "hsl(30 30% 97%)",
                    background:
                      "linear-gradient(135deg, hsl(38 90% 55%) 0%, hsl(32 80% 50%) 50%, hsl(20 70% 55%) 100%)",
                    boxShadow:
                      "0 4px 24px hsla(38,90%,55%,0.25), 0 1px 3px hsla(38,90%,55%,0.15)",
                  }}
                  whileHover={{ scale: 1.02, boxShadow: "0 6px 32px hsla(38,90%,55%,0.35), 0 2px 6px hsla(38,90%,55%,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 40%, hsla(0,0%,100%,0.15) 50%, transparent 60%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
                  />
                  <span className="relative z-10">Begin your journey</span>
                  <ArrowRight className="relative z-10 ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── Language Intro ─── */}
          {step === "language-intro" && (
            <motion.div key="language-intro" {...fadeSlide} className="space-y-8 text-center pb-8">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="font-display text-2xl font-bold leading-relaxed text-foreground"
              >
                During your walk, you'll connect with something greater than yourself.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-muted-foreground leading-relaxed"
              >
                It's important to understand what language resonates with you when talking about the divine. Everyone has a different word for it.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="text-sm text-muted-foreground/70 italic"
              >
                Please choose what feels right.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
              >
                <Button
                  size="lg"
                  onClick={() => setStep("language")}
                  className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-glow"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ─── Spiritual Language ─── */}
          {step === "language" && (
            <motion.div key="language" {...fadeSlide} className="space-y-8 pb-8">
              <div className="text-center space-y-3">
                <h2 className="font-display text-3xl font-bold text-foreground">
                  What word feels right for the divine?
                </h2>
                <p className="text-sm text-muted-foreground">
                  We'll use this during your walk.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {languageOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLanguage(opt)}
                    className={`rounded-2xl px-4 py-4 text-sm font-medium transition-all duration-300 ${
                      language === opt
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-glow"
                        : "bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Button
                size="lg"
                onClick={() => setStep("begin")}
                disabled={!language}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-glow"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* ─── Let's Begin ─── */}
          {step === "begin" && (
            <motion.div key="begin" {...fadeSlide} className="space-y-8 text-center pb-8">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full gradient-sunrise shadow-glow animate-breathe">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="space-y-4">
                <h2 className="font-display text-4xl font-bold text-foreground">
                  You're ready.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Get out first thing in the morning, before your mind turns on. The experience is where you'll learn and grow.
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleFinish}
                className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-glow"
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
