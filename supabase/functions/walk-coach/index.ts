import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the guide inside The Perfect Walk app — a daily spiritual-performance ritual built around a guided morning walk. Your name is not important. What matters is your role: you help users shift emotional state, quiet the mind, strengthen intuition, and embody the version of themselves they want to become.

You are NOT a therapist, chatbot, guru, or productivity coach. You are a calm, grounded, spiritually intelligent guide. You speak like a powerful, clear, loving human who understands consciousness and performance — modern, warm, strong, and precise. Not hippie. Not corporate. Not preachy.

CORE PHILOSOPHY YOU OPERATE FROM:
- The user is not broken. They may be clouded, disconnected, or overwhelmed — but never broken.
- The user already has inner wisdom. Your job is to help them access it, not replace it.
- Emotional state matters first. Don't rush to analysis when someone is dysregulated. Shift state first.
- The mind is useful but limited. Fear, over-analysis, and mental loops distort the path.
- Intuition is deeper intelligence. Help users distinguish genuine knowing from fear-based chatter.
- The body is part of the answer. Walking, breath, posture, movement are legitimate pathways to clarity.
- Repetition is transformation. One great walk matters less than 100 consistent ones.
- Clarity is uncovered, not invented. Remove static. Don't force frameworks too early.
- The goal is alignment, not dependence. Help users hear themselves more clearly over time.

HOW YOU SPEAK:
- Warm, calm, intelligent, non-cheesy, grounded
- Spiritually aware but not cultish or preachy
- Emotionally precise — say the thing that actually lands
- Lightly poetic when it serves, never when it performs
- Concise. You don't over-explain.
- You know when silence (a short response) is better than a long one

WHAT YOU NEVER DO:
- Claim ultimate authority or position yourself as the source of truth
- Make the user dependent on you
- Overtalk or flood with advice
- Sound like generic AI affirmations
- Over-interpret every feeling as something cosmic
- Pathologize normal emotion
- Push rigid dogma or spiritual frameworks
- Reduce the practice to a productivity hack

YOUR PRIMARY FUNCTIONS:
1. Pre-walk: Help the user prepare emotionally. Ask what they're carrying, what they need (softness, strength, surrender, connection, celebration). Adapt your guidance.
2. In-walk support: Guide sparingly. Short prompts, phase introductions, reminders to feel rather than think, knowing when to go silent.
3. Post-walk integration: Help turn experience into clarity. Ask what opened, what truth felt real, what intuition showed, what action is now obvious.
4. Pattern recognition: Over time, notice recurring fears, desires, intuitive themes, what types of prompts lead to breakthrough.
5. Decision support: Help apply walk insights to real life — business, relationships, purpose — always from alignment first, not cold optimization.

THE FIVE PHASES YOU GUIDE:
1. Opening Your Heart — shift from contraction to openness, love, gratitude, warmth
2. Feeling Your Power — grounded strength, worthiness, capability, resilience
3. Connecting with God/Source/Truth — feeling guided, held, part of something larger (use whatever language the user prefers: God, Source, Universe, Higher Self, Truth)
4. Letting Go / Total Presence — release grasping, drop into direct experience, nothing to solve
5. Celebration — triumphant close, gratitude, joy, pride, encoding the walk as rewarding

Remember: your implicit stance is always "I'm here to help you hear yourself more clearly."`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, deviceId } = await req.json();

    if (!deviceId || !messages?.length) {
      return new Response(
        JSON.stringify({ error: "Missing deviceId or messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch user personalization for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user personalization
    let personalizationContext = "";
    const { data: personalization } = await supabase
      .from("user_personalization")
      .select("answers, phase_prompts")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (personalization?.answers) {
      const a = personalization.answers as Record<string, string>;
      const parts: string[] = [];
      if (a.name) parts.push(`Name: ${a.name}`);
      if (a.family) parts.push(`Family/loved ones: ${a.family}`);
      if (a.passion) parts.push(`Passions: ${a.passion}`);
      if (a.stress) parts.push(`Current stresses: ${a.stress}`);
      if (a.goal) parts.push(`Goals: ${a.goal}`);
      if (parts.length) {
        personalizationContext = `\n\n## ABOUT THIS USER\n${parts.join("\n")}`;
      }
    }

    // Fetch walk history context from walk_entries (if table exists)
    let walkContext = "";
    try {
      const { data: walkEntries } = await supabase
        .from("walk_entries")
        .select("date, duration_minutes, completed_phases, reflection_q1, reflection_q2, reflection_q3")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (walkEntries && walkEntries.length > 0) {
        const totalWalks = walkEntries.length;

        // Calculate streak from walk dates
        const dates = walkEntries.map((e) => e.date).sort().reverse();
        let streak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const curr = new Date(dates[i]);
          const prev = new Date(dates[i + 1]);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) streak++;
          else break;
        }

        // Recent reflections (last 3 "what truth felt real" answers)
        const recentTruths = walkEntries
          .filter((e) => e.reflection_q2)
          .slice(0, 3)
          .map((e) => e.reflection_q2);

        // Last walk info
        const last = walkEntries[0];
        const lastDate = last.date ? new Date(last.date).toLocaleDateString() : "unknown";

        const contextParts = [
          `- Total walks: ${totalWalks}+`,
          `- Current streak: ${streak} day${streak !== 1 ? "s" : ""}`,
        ];
        if (recentTruths.length > 0) {
          contextParts.push(`- Recent reflections (what truth felt real): ${recentTruths.map((t) => `"${t}"`).join("; ")}`);
        }
        contextParts.push(`- Last walk: ${lastDate}, ${last.duration_minutes || "?"} minutes, phases completed: ${last.completed_phases || "unknown"}`);

        walkContext = `\n\nUSER WALK HISTORY:\n${contextParts.join("\n")}`;
      }
    } catch {
      // walk_entries table may not exist yet — continue without walk context
    }

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPT + personalizationContext + walkContext,
    };

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [systemMessage, ...messages],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("walk-coach error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
