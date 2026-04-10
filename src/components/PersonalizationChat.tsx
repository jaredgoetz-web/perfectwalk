import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Keyboard, Send, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

const QUESTIONS: { key: string; question: string; placeholder: string }[] = [
  {
    key: "name",
    question: "First things first — what should I call you?",
    placeholder: "Your first name",
  },
  {
    key: "loved_ones",
    question:
      "Tell me about the people (or animals!) you love most. Kids, partner, pets, close friends — whoever fills your heart.",
    placeholder: "e.g. My daughter Luna, my dog Bear...",
  },
  {
    key: "passion",
    question:
      "What lights you up? What are you passionate about — work, hobbies, a cause you care about?",
    placeholder: "e.g. I love painting, building my startup...",
  },
  {
    key: "stress",
    question:
      "What's weighing on you right now? What would you love to release or let go of?",
    placeholder: "e.g. Work pressure, feeling overwhelmed...",
  },
  {
    key: "spirituality",
    question:
      "Do you have a spiritual practice or belief that resonates with you? Meditation, prayer, nature, gratitude — anything goes.",
    placeholder: "e.g. I meditate, I feel connected in nature...",
  },
  {
    key: "joy",
    question:
      "Last one — what makes you feel most alive and grateful? Those moments where everything just clicks.",
    placeholder: "e.g. Dancing with my kids, sunrise runs...",
  },
];

const CUSTOM_VOICE_ID = "dAUhldnXM7Bt5luFXmMZ";

interface PersonalizationChatProps {
  onComplete: () => void;
  onSkip: () => void;
}

const PersonalizationChat = ({ onComplete, onSkip }: PersonalizationChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hey! I'd love to learn a bit about you so I can make your walk experience deeply personal. It'll only take a minute.",
    },
  ]);
  const [currentQ, setCurrentQ] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoListenPending, setAutoListenPending] = useState(false);
  const currentQRef = useRef(0);
  const answersRef = useRef<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const ttsQueueRef = useRef<string[]>([]);
  const isProcessingTTSRef = useRef(false);
  const activeTTSRequestRef = useRef<AbortController | null>(null);
  const ttsSessionRef = useRef(0);
  const didInitRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");

  const stopCurrentAudio = useCallback(() => {
    activeTTSRequestRef.current?.abort();
    activeTTSRequestRef.current = null;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current.src = "";
      currentAudioRef.current.load();
      currentAudioRef.current = null;
    }

    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }

    setIsSpeaking(false);
  }, []);

  const resetTTS = useCallback(() => {
    ttsSessionRef.current += 1;
    ttsQueueRef.current = [];
    isProcessingTTSRef.current = false;
    stopCurrentAudio();
  }, [stopCurrentAudio]);

  const processTTSQueue = useCallback(async () => {
    if (isProcessingTTSRef.current || ttsQueueRef.current.length === 0 || isUnmountedRef.current) {
      return;
    }

    const sessionId = ttsSessionRef.current;
    isProcessingTTSRef.current = true;

    try {
      while (
        ttsQueueRef.current.length > 0 &&
        !isUnmountedRef.current &&
        sessionId === ttsSessionRef.current
      ) {
        const text = ttsQueueRef.current.shift();
        if (!text) continue;

        const cleanText = text
          .replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, "")
          .trim();

        if (!cleanText) continue;

        stopCurrentAudio();
        setIsSpeaking(true);

        const controller = new AbortController();
        activeTTSRequestRef.current = controller;

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText, voiceId: CUSTOM_VOICE_ID }),
          signal: controller.signal,
        });

        if (sessionId !== ttsSessionRef.current || isUnmountedRef.current) break;
        if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

        const audioBlob = await response.blob();
        if (sessionId !== ttsSessionRef.current || isUnmountedRef.current) break;

        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudioUrlRef.current = audioUrl;

        const audio = new Audio(audioUrl);
        audio.preload = "auto";
        currentAudioRef.current = audio;

        await new Promise<void>((resolve) => {
          const cleanup = () => {
            audio.onended = null;
            audio.onerror = null;
            resolve();
          };
          audio.onended = cleanup;
          audio.onerror = cleanup;
          audio.play().catch(cleanup);
        });

        if (currentAudioRef.current === audio) currentAudioRef.current = null;
        if (currentAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          currentAudioUrlRef.current = null;
        }

        activeTTSRequestRef.current = null;
        setIsSpeaking(false);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error("TTS error:", err);
      }
      stopCurrentAudio();
    } finally {
      activeTTSRequestRef.current = null;
      setIsSpeaking(false);
      isProcessingTTSRef.current = false;

      // Auto-start listening after TTS finishes speaking
      if (!isUnmountedRef.current) {
        setAutoListenPending(true);
      }
    }
  }, [stopCurrentAudio]);

  const speakText = useCallback(
    (text: string, options?: { interrupt?: boolean }) => {
      if (options?.interrupt) resetTTS();
      ttsQueueRef.current.push(text);
      void processTTSQueue();
    },
    [processTTSQueue, resetTTS]
  );

  // Auto-start listening after TTS finishes
  useEffect(() => {
    if (
      autoListenPending &&
      inputMode === "voice" &&
      showQuestion &&
      currentQ < QUESTIONS.length &&
      !isListening &&
      !isSpeaking &&
      !isGenerating
    ) {
      setAutoListenPending(false);
      const t = setTimeout(() => startListening(), 400);
      return () => clearTimeout(t);
    }
    if (autoListenPending) setAutoListenPending(false);
  }, [autoListenPending, inputMode, showQuestion, currentQ, isListening, isSpeaking, isGenerating]);

  // Start continuous speech recognition — auto-submits after silence
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInputMode("text");
      return;
    }

    // Stop any ongoing TTS
    resetTTS();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    transcriptRef.current = "";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullText = (finalTranscript + interimTranscript).trim();
      transcriptRef.current = fullText;

      // Reset silence timer on each speech result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      if (fullText) {
        // After 2 seconds of silence, auto-submit
        silenceTimerRef.current = setTimeout(() => {
          const text = transcriptRef.current.trim();
          if (text && recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      const text = transcriptRef.current.trim();
      if (text) {
        processAnswer(text);
      }
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      // "no-speech" is normal — user just didn't say anything yet
      if (event.error !== "no-speech") {
        console.error("Speech error:", event.error);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setInputMode("text");
    }
  }, [resetTTS]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    speakText(messages[0].text, { interrupt: true });

    const t = window.setTimeout(() => {
      const q = QUESTIONS[0].question;
      setMessages((prev) => [...prev, { role: "assistant", text: q }]);
      speakText(q);
    }, 800);

    return () => window.clearTimeout(t);
  }, [messages, speakText]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showQuestion && inputMode === "text") inputRef.current?.focus();
  }, [showQuestion, currentQ, inputMode]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      resetTTS();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [resetTTS]);

  // Keep refs in sync with state so callbacks always read fresh values
  useEffect(() => {
    currentQRef.current = currentQ;
  }, [currentQ]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const processAnswer = useCallback((value: string) => {
    const qIndex = currentQRef.current;
    const q = QUESTIONS[qIndex];
    if (!q) return; // safety check
    const newAnswers = { ...answersRef.current, [q.key]: value };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    setInput("");
    setShowQuestion(false);
    setMessages((prev) => [...prev, { role: "user", text: value }]);

    const nextQ = qIndex + 1;

    if (nextQ < QUESTIONS.length) {
      window.setTimeout(() => {
        const nextText = QUESTIONS[nextQ].question;
        setMessages((prev) => [...prev, { role: "assistant", text: nextText }]);
        speakText(nextText, { interrupt: true });
        currentQRef.current = nextQ;
        setCurrentQ(nextQ);
        setShowQuestion(true);
      }, 600);
    } else {
      currentQRef.current = nextQ;
      setCurrentQ(nextQ);
      window.setTimeout(() => {
        const doneText = `Beautiful, ${newAnswers.name || "friend"}! Let me craft your personalized walk experience...`;
        setMessages((prev) => [...prev, { role: "assistant", text: doneText }]);
        speakText(doneText, { interrupt: true });
        generatePrompts(newAnswers);
      }, 600);
    }
  }, [speakText]);

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    processAnswer(value);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- called from setTimeout in processAnswer, hoisted
  const generatePrompts = async (finalAnswers: Record<string, string>) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-walk-prompts", {
        body: { answers: finalAnswers },
      });

      if (error) throw error;

      const prompts = data?.prompts;
      if (!prompts) throw new Error("No prompts returned");

      const deviceId = getDeviceId();
      await supabase.from("user_personalization").upsert(
        { device_id: deviceId, answers: finalAnswers, phase_prompts: prompts },
        { onConflict: "device_id" }
      );

      localStorage.setItem("tpw_phase_prompts", JSON.stringify(prompts));
      localStorage.setItem("tpw_personalized", "true");

      const readyText = "Your walk is ready. Each phase is now crafted just for you. Taking you there now...";
      setMessages((prev) => [...prev, { role: "assistant", text: readyText }]);
      speakText(readyText, { interrupt: true });
      setIsGenerating(false);

      // Auto-navigate to the personalized walk after a brief pause
      setTimeout(() => {
        if (!isUnmountedRef.current) onComplete();
      }, 3000);
    } catch (err) {
      console.error("Failed to generate prompts:", err);
      setIsGenerating(false);

      localStorage.setItem("tpw_personalization_answers", JSON.stringify(finalAnswers));
      localStorage.setItem("tpw_personalized", "true");

      const fallbackText = "I saved your info. I'll personalize your prompts next time — for now, let's walk with the standard experience.";
      setMessages((prev) => [...prev, { role: "assistant", text: fallbackText }]);
      speakText(fallbackText, { interrupt: true });

      // Auto-navigate even on fallback
      setTimeout(() => {
        if (!isUnmountedRef.current) onComplete();
      }, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDone = currentQ >= QUESTIONS.length && !isGenerating;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-sunrise">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold text-foreground">
            Personalize Your Walk
          </span>
        </div>
        <button
          onClick={onSkip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-card text-foreground shadow-warm"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-warm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Crafting your experience...
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0.5rem) + 0.5rem)" }}>
        {isDone ? (
          // Auto-navigating — show subtle transition state
          <div className="flex items-center justify-center gap-2 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Preparing your walk...</span>
          </div>
        ) : showQuestion && currentQ < QUESTIONS.length ? (
          <div className="space-y-3">
            {inputMode === "voice" ? (
              <div className="flex flex-col items-center gap-3">
                {/* Tap-to-toggle mic — auto-listens after AI speaks */}
                <button
                  onClick={toggleListening}
                  disabled={isSpeaking}
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                    isListening
                      ? "scale-110 bg-destructive text-destructive-foreground"
                      : isSpeaking
                      ? "opacity-50 gradient-sunrise text-primary-foreground"
                      : "gradient-sunrise text-primary-foreground shadow-warm hover:scale-105"
                  }`}
                >
                  {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                </button>
                <p className="text-xs text-muted-foreground">
                  {isSpeaking
                    ? "Listening to your guide..."
                    : isListening
                    ? "Speak naturally — I'll know when you're done"
                    : "Tap to speak"}
                </p>

                {/* Listening animation */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-1"
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-primary"
                        animate={{ height: [8, 20, 8] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                )}

                <button
                  onClick={() => {
                    stopListening();
                    setInputMode("text");
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  Type instead
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={QUESTIONS[currentQ]?.placeholder}
                    className="flex-1 rounded-full border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="h-11 w-11 shrink-0 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <button
                  onClick={() => setInputMode("voice")}
                  className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Mic className="h-3.5 w-3.5" />
                  Use voice instead
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {isSpeaking && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 shadow-warm backdrop-blur-sm">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-3 w-1 rounded-full bg-primary"
                  animate={{ scaleY: [1, 1.8, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Speaking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizationChat;
