import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, ArrowRight } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show first question after intro
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: QUESTIONS[0].question },
      ]);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showQuestion) inputRef.current?.focus();
  }, [showQuestion, currentQ]);

  const handleSend = async () => {
    const value = input.trim();
    if (!value) return;

    const q = QUESTIONS[currentQ];
    const newAnswers = { ...answers, [q.key]: value };
    setAnswers(newAnswers);
    setInput("");
    setShowQuestion(false);

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: value }]);

    const nextQ = currentQ + 1;

    if (nextQ < QUESTIONS.length) {
      // Show next question after a short delay
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: QUESTIONS[nextQ].question },
        ]);
        setCurrentQ(nextQ);
        setShowQuestion(true);
      }, 600);
    } else {
      // All questions answered — generate prompts
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Beautiful, ${newAnswers.name || "friend"}! ✨ Let me craft your personalized walk experience...`,
          },
        ]);
        generatePrompts(newAnswers);
      }, 600);
    }
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

      // Save to database
      const deviceId = getDeviceId();
      await supabase.from("user_personalization").upsert(
        {
          device_id: deviceId,
          answers: finalAnswers,
          phase_prompts: prompts,
        },
        { onConflict: "device_id" }
      );

      // Also save to localStorage for immediate use
      localStorage.setItem("tpw_phase_prompts", JSON.stringify(prompts));
      localStorage.setItem("tpw_personalized", "true");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Your walk is now personalized! 🌅 Each phase will have prompts crafted just for you. Ready to take your first Perfect Walk?",
        },
      ]);

      setIsGenerating(false);
    } catch (err) {
      console.error("Failed to generate prompts:", err);
      setIsGenerating(false);

      // Fallback: save answers and use defaults
      localStorage.setItem("tpw_personalization_answers", JSON.stringify(finalAnswers));
      localStorage.setItem("tpw_personalized", "true");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I saved your info! I'll personalize your walk prompts next time. For now, you'll get the standard experience — still amazing! 🌟",
        },
      ]);
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

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-warm rounded-bl-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Crafting your experience...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input or CTA */}
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
        ) : (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizationChat;
