import { useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateWalkEntry, useRefreshWalkEntries } from "@/lib/walkStore";
import { getDeviceId } from "@/lib/deviceId";
import { useAuth } from "@/lib/auth";
import type { SpeechRecognitionEvent, SpeechRecognitionInstance, SpeechRecognitionConstructor } from "@/lib/webSpeech";

const moods = [
  { key: "amazing", emoji: "✨", label: "Amazing" },
  { key: "great", emoji: "🌟", label: "Great" },
  { key: "good", emoji: "☀️", label: "Good" },
  { key: "neutral", emoji: "🌤️", label: "Neutral" },
  { key: "tough", emoji: "🌧️", label: "Tough" },
] as const;

const reflectionQuestions = [
  { key: "q1", question: "What opened up during your walk?" },
  { key: "q2", question: "What truth felt real today?" },
  { key: "q3", question: "What action feels aligned right now?" },
] as const;

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
};

const fallbackSynthesis = "You showed up today and that matters. Take what opened and carry it forward.";

const JournalNew = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const refreshWalkEntries = useRefreshWalkEntries();
  const [searchParams] = useSearchParams();
  const walkId = searchParams.get("walkId");

  const [step, setStep] = useState<"mood" | "q1" | "q2" | "q3" | "synthesis">("mood");
  const [mood, setMood] = useState<string>("");
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [currentInput, setCurrentInput] = useState("");
  const [synthesis, setSynthesis] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef("");

  const startRecording = useCallback(() => {
    const RecognitionCtor = (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;
    if (!RecognitionCtor) {
      alert("Speech recognition is not supported in your browser. Try Chrome or Safari.");
      return;
    }

    baseTextRef.current = currentInput;
    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      const base = baseTextRef.current;
      const separator = base && !base.endsWith(" ") ? " " : "";
      setCurrentInput(base + separator + finalTranscript + interimTranscript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [currentInput]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const handleNextQuestion = () => {
    if (step === "mood") {
      setStep("q1");
      setCurrentInput("");
      return;
    }

    const updatedAnswers = { ...answers, [step]: currentInput };
    setAnswers(updatedAnswers);
    setCurrentInput("");

    if (step === "q1") setStep("q2");
    else if (step === "q2") setStep("q3");
    else if (step === "q3") {
      setStep("synthesis");
      void generateSynthesis(updatedAnswers);
    }
  };

  const generateSynthesis = async (reflections: typeof answers) => {
    setIsSynthesizing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/walk-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          deviceId: getDeviceId(),
          mode: "post_walk_synthesis",
          messages: [
            {
              role: "user",
              content: `I just finished my walk. Here are my reflections:\n\nWhat opened up: ${reflections.q1}\n\nWhat truth felt real: ${reflections.q2}\n\nWhat action feels aligned: ${reflections.q3}\n\nGive me a brief 2-3 sentence synthesis of my walk. Be warm, specific, and concise.`,
            },
          ],
        }),
      });

      if (!response.ok || !response.body) {
        setSynthesis(fallbackSynthesis);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              result += delta;
              setSynthesis(result);
            }
          } catch (error) {
            console.debug("Ignored synthesis chunk parse error", error);
          }
        }
      }

      if (!result) setSynthesis(fallbackSynthesis);
    } catch (error) {
      console.error("Failed to generate synthesis", error);
      setSynthesis(fallbackSynthesis);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSave = async () => {
    if (walkId) {
      await updateWalkEntry(walkId, {
        mood: mood as "amazing" | "great" | "good" | "neutral" | "tough",
        journalEntry: [answers.q1, answers.q2, answers.q3].filter(Boolean).join(" | "),
        reflectionQ1: answers.q1,
        reflectionQ2: answers.q2,
        reflectionQ3: answers.q3,
      });
      refreshWalkEntries();
    }

    navigate("/journal");
  };

  const currentQuestion = reflectionQuestions.find((question) => question.key === step);

  return (
    <div className="min-h-screen pb-24">
      <div className="flex items-center gap-3 px-5 pt-5">
        <button onClick={() => navigate("/journal")} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-semibold text-foreground">Post-Walk Reflection</h1>
      </div>

      <div className="mx-auto max-w-lg px-5">
        <div className="mt-6 flex justify-center gap-2">
          {["mood", "q1", "q2", "q3", "synthesis"].map((value) => (
            <div key={value} className={`h-2 rounded-full transition-all duration-300 ${value === step ? "w-8 bg-primary" : "w-2 bg-secondary"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "mood" && (
            <motion.div key="mood" {...fadeSlide}>
              <div className="mt-8 rounded-2xl gradient-sunrise p-6 text-center text-primary-foreground">
                <p className="text-4xl">🎉</p>
                <p className="mt-2 font-display text-2xl font-bold">Walk Complete!</p>
                <p className="mt-1 text-sm opacity-90">You showed up for yourself. That’s everything.</p>
              </div>

              <div className="mt-8">
                <p className="font-display text-lg font-semibold text-foreground">How are you feeling?</p>
                <div className="mt-3 flex gap-2">
                  {moods.map((option) => (
                    <button key={option.key} onClick={() => setMood(option.key)} className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-3 transition-all ${mood === option.key ? "bg-primary/10 ring-2 ring-primary/40" : "bg-card hover:bg-secondary"}`}>
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-xs text-muted-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleNextQuestion} disabled={!mood} className="mt-8 w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm" size="lg">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {currentQuestion && (
            <motion.div key={step} {...fadeSlide}>
              <div className="mt-10 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Reflection {reflectionQuestions.findIndex((question) => question.key === step) + 1} of 3</p>
                <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-foreground">{currentQuestion.question}</h2>
              </div>

              <Textarea value={currentInput} onChange={(event) => setCurrentInput(event.target.value)} placeholder="Speak or type what comes to mind..." className="mt-6 min-h-[120px] resize-none rounded-xl border-border bg-card text-foreground" autoFocus />

              <Button type="button" variant={isRecording ? "destructive" : "outline"} onClick={isRecording ? stopRecording : startRecording} className={`mt-3 w-full gap-2 rounded-full ${isRecording ? "" : "border-primary/30 text-primary hover:bg-primary/10"}`}>
                {isRecording ? <><MicOff className="h-4 w-4" />Stop Recording</> : <><Mic className="h-4 w-4" />Speak Your Reflection</>}
              </Button>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={handleNextQuestion} className="flex-1 rounded-full">Skip</Button>
                <Button onClick={handleNextQuestion} disabled={!currentInput.trim()} className="flex-1 gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm">
                  {step === "q3" ? "See Reflection" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "synthesis" && (
            <motion.div key="synthesis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "radial-gradient(ellipse at 50% 40%, hsl(32 80% 50% / 0.06) 0%, hsl(var(--background)) 70%)" }}>
              <div className="flex flex-1 flex-col items-center justify-center max-w-sm">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 150, damping: 20 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 animate-breathe">
                  <Sparkles className="h-7 w-7 text-primary" />
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="mt-6 font-display text-2xl font-bold text-foreground">Your Walk Today</motion.h2>
                <div className="mt-8">
                  {isSynthesizing && !synthesis ? (
                    <div className="flex items-center justify-center gap-1.5">{[0, 1, 2].map((index) => <motion.div key={index} className="h-1.5 w-1.5 rounded-full bg-primary/40" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }} />)}</div>
                  ) : (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="text-center font-display text-lg italic leading-relaxed text-foreground/80">"{synthesis}"</motion.p>
                  )}
                </div>
              </div>

              {synthesis && !isSynthesizing && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="w-full max-w-sm" style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom, 1.5rem) + 1.5rem)" }}>
                  <Button onClick={() => void handleSave()} className="w-full gap-2 rounded-full gradient-sunrise py-6 text-primary-foreground shadow-glow" size="lg">
                    <Check className="h-4 w-4" />
                    Save Reflection
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JournalNew;
