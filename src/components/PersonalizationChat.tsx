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

  // Speak assistant message via TTS
  const speakText = useCallback(async (text: string) => {
    // Strip emojis for cleaner TTS
    const cleanText = text.replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, "").trim();
    if (!cleanText) return;

    try {
      setIsSpeaking(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.addEventListener("ended", () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
      });
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
    }
  }, []);

  // Show first question after intro
  useEffect(() => {
    const t1 = setTimeout(() => {
      speakText(messages[0].text);
    }, 300);

    const t2 = setTimeout(() => {
      const q = QUESTIONS[0].question;
      setMessages((prev) => [...prev, { role: "assistant", text: q }]);
      speakText(q);
    }, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showQuestion && inputMode === "text") inputRef.current?.focus();
  }, [showQuestion, currentQ, inputMode]);

  // Voice recording
  const startRecording = async () => {
    try {
      // Stop any playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
        setIsSpeaking(false);
      }

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
      // Fall back to text mode
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

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
      setTimeout(() => {
        const nextText = QUESTIONS[nextQ].question;
        setMessages((prev) => [...prev, { role: "assistant", text: nextText }]);
        speakText(nextText);
        setCurrentQ(nextQ);
        setShowQuestion(true);
      }, 600);
    } else {
      setTimeout(() => {
        const doneText = `Beautiful, ${newAnswers.name || "friend"}! ✨ Let me craft your personalized walk experience...`;
        setMessages((prev) => [...prev, { role: "assistant", text: doneText }]);
        speakText(doneText);
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
      speakText(readyText);
      setIsGenerating(false);
    } catch (err) {
      console.error("Failed to generate prompts:", err);
      setIsGenerating(false);

      localStorage.setItem("tpw_personalization_answers", JSON.stringify(finalAnswers));
      localStorage.setItem("tpw_personalized", "true");

      const fallbackText = "I saved your info! I'll personalize your walk prompts next time. For now, you'll get the standard experience — still amazing! 🌟";
      setMessages((prev) => [...prev, { role: "assistant", text: fallbackText }]);
      speakText(fallbackText);
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
      {/* Header */}
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card text-foreground shadow-warm rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(isGenerating || isTranscribing) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-warm rounded-bl-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {isTranscribing ? "Listening..." : "Crafting your experience..."}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
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
                {/* Mic button */}
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isTranscribing}
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
                    isRecording
                      ? "bg-destructive text-destructive-foreground scale-110 animate-pulse"
                      : "gradient-sunrise text-primary-foreground shadow-warm hover:scale-105"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-7 w-7" />
                  ) : (
                    <Mic className="h-7 w-7" />
                  )}
                </button>
                <p className="text-xs text-muted-foreground">
                  {isRecording ? "Release to send" : "Hold to speak"}
                </p>

                {/* Switch to text */}
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

                {/* Switch to voice */}
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

      {/* Speaking indicator */}
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
