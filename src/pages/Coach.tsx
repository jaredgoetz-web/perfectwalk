import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Trash2, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/walk-coach`;

async function streamChat({
  messages,
  deviceId,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  deviceId: string;
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, deviceId }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }
  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: rd, value } = await reader.read();
    if (rd) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

const WELCOME = "I'm here whenever you need to talk about your practice, your walks, or anything that's on your heart. What's on your mind?";

const Coach = () => {
  const deviceId = getDeviceId();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("coach_messages")
        .select("role, content")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: true });
      if (data?.length) {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
      setLoadingHistory(false);
    })();
  }, [deviceId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const persistMessage = async (role: string, content: string) => {
    await supabase.from("coach_messages").insert({ device_id: deviceId, role, content });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    await persistMessage("user", text);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((p) => {
        const last = p[p.length - 1];
        if (last?.role === "assistant" && p.length > 0 && p[p.length - 2]?.content === text) {
          return p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...p, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        deviceId,
        onDelta: upsert,
        onDone: async () => {
          setIsLoading(false);
          if (assistantSoFar) await persistMessage("assistant", assistantSoFar);
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({ title: "Coach Error", description: e.message, variant: "destructive" });
    }
  };

  const clearHistory = async () => {
    await supabase.from("coach_messages").delete().eq("device_id", deviceId);
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const displayMessages = messages.length ? messages : [{ role: "assistant" as const, content: WELCOME }];

  return (
    <div className="flex h-screen flex-col pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/8 animate-breathe">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Your Coach</h1>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearHistory} title="Clear history" className="text-muted-foreground/40 hover:text-muted-foreground">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages — conversation style, not chat bubbles */}
      <ScrollArea className="flex-1" ref={scrollRef as any}>
        <div className="mx-auto max-w-lg px-5 py-4">
          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-primary/40"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {displayMessages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i < 3 ? i * 0.1 : 0 }}
                >
                  {m.role === "assistant" ? (
                    /* Coach message — serif, full-width, no bubble */
                    <div className="border-l-2 border-primary/15 pl-4">
                      <div className="prose prose-sm max-w-none font-display text-foreground/85 leading-relaxed">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    /* User message — subtly differentiated */
                    <div className="pl-8">
                      <p className="text-sm leading-relaxed text-foreground/70">
                        {m.content}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Breathing dots while loading */}
              <AnimatePresence>
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-l-2 border-primary/15 pl-4 py-2"
                  >
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-primary/30"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input — clean, minimal */}
      <div className="border-t border-border/30 bg-background px-5 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0.5rem) + 0.5rem)" }}
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say what's on your mind..."
            className="flex-1 rounded-full border border-border/50 bg-card px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-colors"
          />
          <motion.div whileTap={{ scale: 0.93 }}>
            <Button
              onClick={send}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full gradient-sunrise text-primary-foreground shadow-warm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Coach;
