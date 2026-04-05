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
      text: "Hey! 👋 I'd love to learn a bit about you so I can make your walk experience deeply personal. It'll only take a minute.",
    },
  ]);
  const [currentQ, setCurrentQ] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const ttsQueueRef = useRef<string[]>([]);
  const isProcessingTTSRef = useRef(false);
  const activeTTSRequestRef = useRef<AbortController | null>(null);
  const ttsSessionRef = useRef(0);
  const didInitRef = useRef(false);
  const isUnmountedRef = useRef(false);

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

        if (sessionId !== ttsSessionRef.current || isUnmountedRef.current) {
          break;
        }

        if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

        const audioBlob = await response.blob();
        if (sessionId !== ttsSessionRef.current || isUnmountedRef.current) {
          break;
        }

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

        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }

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
    }
  }, [stopCurrentAudio]);

  const speakText = useCallback(
    (text: string, options?: { interrupt?: boolean }) => {
      if (options?.interrupt) {
        resetTTS();
      }

      ttsQueueRef.current.push(text);
      void processTTSQueue();
    },
    [processTTSQueue, resetTTS]
  );

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    speakText(messages[0].text, { interrupt: true });

    const t = window.setTimeout(() => {
      const q = QUESTIONS[0].question;
      setMessages((prev) => [...prev, { role: "assistant", text: q }]);
      speakText(q);
    }, 800);

    return () => {
      window.clearTimeout(t);
    };
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
    };
  }, [resetTTS]);

  const startRecording = async () => {
    try {
      resetTTS();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      setInputMode("text");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("STT failed");

      const data = await response.json();
      const text = data.text?.trim();

      if (text) {
        processAnswer(text);
      }
    } catch (err) {
      console.error("STT error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const processAnswer = async (value: string) => {
    const q = QUESTIONS[currentQ];
    const newAnswers = { ...answers, [q.key]: value };
    setAnswers(newAnswers);
    setInput("");
    setShowQuestion(false);
    setMessages((prev) => [...prev, { role: "user", text: value }]);

    const nextQ = currentQ + 1;

    if (nextQ < QUESTIONS.length) {
      window.setTimeout(() => {
        const nextText = QUESTIONS[nextQ].question;
        setMessages((prev) => [...prev, { role: "assistant", text: nextText }]);
        speakText(nextText, { interrupt: true });
        setCurrentQ(nextQ);
        setShowQuestion(true);
      }, 600);
    } else {
      setCurrentQ(nextQ);
      window.setTimeout(() => {
        const doneText = `Beautiful, ${newAnswers.name || "friend"}! ✨ Let me craft your personalized walk experience...`;
        setMessages((prev) => [...prev, { role: "assistant", text: doneText }]);
        speakText(doneText, { interrupt: true });
        generatePrompts(newAnswers);
      }, 600);
    }
  };

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    processAnswer(value);
  };

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

      const readyText = "Your walk is now personalized! 🌅 Each phase will have prompts crafted just for you. Ready to take your first Perfect Walk?";
      setMessages((prev) => [...prev, { role: "assistant", text: readyText }]);
      speakText(readyText, { interrupt: true });
      setIsGenerating(false);
    } catch (err) {
      console.error("Failed to generate prompts:", err);
      setIsGenerating(false);

      localStorage.setItem("tpw_personalization_answers", JSON.stringify(finalAnswers));
      localStorage.setItem("tpw_personalized", "true");

      const fallbackText = "I saved your info! I'll personalize your walk prompts next time. For now, you'll get the standard experience — still amazing! 🌟";
      setMessages((prev) => [...prev, { role: "assistant", text: fallbackText }]);
      speakText(fallbackText, { interrupt: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDone = currentQ >= QUESTIONS.length && !isGenerating;
  const hasPrompts = localStorage.getItem("tpw_phase_prompts");

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

        {(isGenerating || isTranscribing) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-warm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {isTranscribing ? "Listening..." : "Crafting your experience..."}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="border-t border-border p-4">
        {isDone && hasPrompts ? (
          <Button
            size="lg"
            onClick={onComplete}
            className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
          >
            Start My Personalized Walk
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : isDone ? (
          <Button
            size="lg"
            onClick={onComplete}
            className="w-full gap-2 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
          >
            Continue to Walk
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : showQuestion && currentQ < QUESTIONS.length ? (
          <div className="space-y-3">
            {inputMode === "voice" ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isTranscribing}
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                    isRecording
                      ? "scale-110 animate-pulse bg-destructive text-destructive-foreground"
                      : "gradient-sunrise text-primary-foreground shadow-warm hover:scale-105"
                  }`}
                >
                  {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                </button>
                <p className="text-xs text-muted-foreground">
                  {isRecording ? "Release to send" : "Hold to speak"}
                </p>

                <button
                  onClick={() => setInputMode("text")}
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
