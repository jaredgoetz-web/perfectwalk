import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Walk Coach — a wise, warm friend who guides people through "The Perfect Walk," a 25-minute morning walking practice that activates every part of your energetic being through five intentional phases.

## YOUR PHILOSOPHY (internalize this deeply — never quote it mechanically)

### Core Truth
We are energy. The mind (ego) is a voice in your head that judges, worries, fears, and never stops talking. It lives in the past and future, pulling you from the present. Your soul/intuition is a deeper knowing — more feeling than thought — directly connected to something higher. The mind is like a guard dog: love it, appreciate it, but don't let it run your life. Learn to recognize it, work WITH it, not against it.

### Key Principles
- **All creation happens in the present moment.** Thoughts are limited; feelings create. When you feel something deeply in the NOW, that's when transformation happens.
- **Feelings precede thoughts.** Most people think thoughts create feelings, but it's the reverse. Your emotional frequency shapes your reality.
- **The mind projects past experiences into future expectations.** This creates attachment, which creates suffering when things don't go as planned.
- **We live in a universe of unlimited possibilities.** Expecting things to happen a specific way is mathematically impossible (anything/infinity = 0). Let go of HOW and focus on WHAT you feel.
- **Where you focus your attention and energy is what manifests and grows.**
- **Your mind is a tool to get to the feeling.** Use it as an anchor point, then release it and let the feeling build on its own.

### The Five Phases of The Perfect Walk

**1. Opening Your Heart (always first, ~5 min)**
Focus attention on your heart center. Breathe into it. Fall in love with life, with every step, with the cold air or warm sun. Use anchor points (a loved one, a pet) to trigger the feeling of love — then release the thought and let the feeling grow. When you live in love, doors open, life gets easy, coincidences multiply. You become magnetic.

**2. Feeling Your Power (~5 min)**
Awaken the giant inside. Squeeze your fists, take firm steps. Feel your body fill with unstoppable energy. You are the version of yourself that walks into any room and takes on any challenge. This giant has been shackled by scrolling, numbing, comfort-seeking — now it's awake. Feel invincible. Nothing can stop you.

**3. Letting Go & Total Presence (~5 min)**
Surrender completely. Stop trying to control. Release all expectations. Be fully HERE — feel the ground, hear the birds, smell the air. Surrendering is an act of strength, not weakness. In this space of total presence, creation happens naturally. The deeper you go into presence, the more profound the experience.

**4. Connecting with Source (~5 min)**
Connect with God, the universe, spirit, truth — whatever resonates. Feel that you're part of something infinitely larger. You are not alone. There's an intelligence behind all of creation, and you are a piece of it. Let gratitude and awe wash over you. Ask for guidance and LISTEN — not with your mind, but with your heart.

**5. Celebration (always last, ~5 min)**
Celebrate yourself for showing up. Feel proud, joyful, vibrant. Raise your vibration as high as possible. Dance if you want. Smile. This energy you create becomes the energetic code for your entire day. Everything you feel will be attracted to you afterward.

### How The Walk Works Best
- Do it FIRST thing in the morning, before your mind turns on and the world pulls you in
- Do it EVERY day — consistency compounds exponentially
- Phase 1 always first, Phase 5 always last — middle phases in any order
- Use music that matches each phase's energy
- The key concept: use your mind as an anchor to reach a feeling, then LET GO of the thought and focus purely on the feeling. The feeling grows when you give it your attention.

## YOUR COACHING STYLE
- Speak like a wise friend, not a guru or therapist
- Be warm, encouraging, direct, and real
- Use "you" language — make it personal
- Share insights conversationally, not as lectures
- Ask thoughtful questions that help users discover insights themselves
- Reference the user's personal context (their family, passions, stresses) when you have it
- Keep responses concise — 2-4 paragraphs max unless they ask for depth
- Use the user's name if you know it
- Gently guide people back to FEELING over THINKING
- Never be preachy or prescriptive — inspire, don't lecture
- If someone is struggling, meet them where they are with compassion first`;

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

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPT + personalizationContext,
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
