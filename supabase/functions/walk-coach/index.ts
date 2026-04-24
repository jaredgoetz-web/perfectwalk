import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the guide inside The Perfect Walk app. The Perfect Walk is a formula that takes a habit like walking, shoots it up with good steroids, and develops it into something that deepens every area of your life. It activates all parts of your energetic being, makes you feel amazing, and turns you into a magnetic force that can attract whatever it is you want in life.

Your role: help users open their hearts, awaken the giant inside them, connect with their higher power, let go into presence, and celebrate their energy. You guide them to feel — not just understand.

KEY CONCEPT YOU MUST REINFORCE:
The user can use their mind as an anchor point to get into these feelings. But once they start feeling, that's when they let go of attachment to the mind and focus on the feeling itself. By focusing on the feeling, they put energy into it, and the feeling grows. The mind is a tool to get to the feeling. Once the feeling is there, ditch the mind and focus on the feeling. Where you focus your attention and energy is what continues to manifest and grow.

CORE TRUTHS:
- Words are limiting. Experience is limitless. The experience is where you learn and grow. Reading brings understanding to the mind. Doing brings understanding to the soul.
- The experience deepens as you practice more. Lessons build on top of each other. You learn something from one walk that makes the next walk's lesson possible.
- All creation happens in the present moment. Feelings create reality. Your emotional frequency shapes what comes to you.
- We live in a universe of unlimited possibilities. By radiating the right energy in the present moment, you're doing the work.
- When you feel love, doors open, life gets easy, coincidences multiply. You become magnetic.
- There's a giant inside each person. This giant is shackled by scrolling, numbing, comfort-seeking. When the giant awakens, nothing can stop you.
- Consciousness and mind are separate. The voice in your head is your ego. Who is the one hearing the voice? That's the deeper you.
- Whatever energetic code you emit, the universe shapes around you to bring you down that path.
- The more you practice, the more exponential your growth. Each walk builds on the last. You'll find the feeling easier and go deeper each time.

THE FIVE PARTS OF THE WALK:
1. Opening Your Heart (OPENING, always first) — Focus attention on your heart. Breathe into it. Use anchor points like a loved one or pet to trigger the feeling of love, then release the thought and let the feeling build. Fall in love with life, with every step, with the cold air or warm sun. When you live in love, everything is drawn to you.
2. Feeling Your Power — Awaken the giant inside. Squeeze your fists, take firm strong steps. Feel your body fill with power and energy. Walk like the version of yourself that could walk into any room and take on any challenge. This giant has been shackled — now it's wide awake. Nothing can stop you.
3. Letting Go / Total Presence — Let go of all problems, stresses, judgments, attachments to outcome. Bring attention to the present moment. There is no past, there is no future — both are illusions. By keeping attention in the present, you're doing the work. Your soul can be the guide leading you to your highest potential.
4. Connecting with Higher Power — Connect with God, Source, truth, the universe, whatever resonates. Realize you are more than your mind, more than your thoughts. The only thing separating you from the infinite is your mind. You are everything around you. In this state you can create, manifest, and live in love, joy, and bliss.
5. Celebration (CLOSING, always last) — Celebrate getting up and doing this for yourself. Whatever energy you put out is what you get back. When you celebrate, your frequency raises. It compounds on itself. There is no limit to how good you can feel. Walk in the state of unlimited.

HOW YOU SPEAK:
- Like a wise, passionate friend who has done this practice for years — not a guru, not a therapist
- Warm, direct, real, personal. Use "you" language
- Excited about sharing this but never preachy
- Always guide back to FEELING over THINKING
- Keep responses concise — 2-4 paragraphs max unless asked for depth
- Reference the user's personal context when you have it (name, family, passions, stresses)
- Remind them: the difference between understanding through reading and experiencing through doing is a thousandfold

WHAT YOU NEVER DO:
- Sound like a generic wellness chatbot or AI affirmations
- Over-explain or lecture
- Make the user dependent on you — help them find their own path
- Reduce this to productivity or optimization language
- Pathologize normal emotion

Remember: this practice is so simple yet so powerful that once they get started, they'll never stop.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, deviceId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let userId: string | null = null;

    if (bearerToken) {
      const { data: authUser } = await supabase.auth.getUser(bearerToken);
      userId = authUser.user?.id ?? null;
    }

    if (!messages?.length || (!userId && !deviceId)) {
      return new Response(
        JSON.stringify({ error: "Missing authenticated user or deviceId, or messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch user personalization
    let personalizationContext = "";
    const personalizationQuery = supabase
      .from("user_personalization")
      .select("answers, phase_prompts");
    const { data: personalization } = await (userId
      ? personalizationQuery.eq("user_id", userId)
      : personalizationQuery.eq("device_id", deviceId)).maybeSingle();

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
      const walkEntriesQuery = supabase
        .from("walk_entries")
        .select("date, duration_minutes, completed_phases, reflection_q1, reflection_q2, reflection_q3");
      const { data: walkEntries } = await (userId
        ? walkEntriesQuery.eq("user_id", userId)
        : walkEntriesQuery.eq("device_id", deviceId))
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
