import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHASES = [
  {
    id: 1,
    title: "Opening Your Heart",
    subtitle: "Fall in love with life",
    guidance:
      "Generate a deeply personal prompt that helps the walker open their heart. Reference specific people, pets, or things they love based on their answers.",
  },
  {
    id: 2,
    title: "Feeling Your Power",
    subtitle: "Awaken the giant within",
    guidance:
      "Generate a motivating prompt that connects to the walker's strengths, career, passions, or achievements they shared.",
  },
  {
    id: 3,
    title: "Letting Go",
    subtitle: "Total presence in the moment",
    guidance:
      "Generate a calming prompt that helps the walker release specific stresses or worries they mentioned. Guide them into presence.",
  },
  {
    id: 4,
    title: "Connecting with Source",
    subtitle: "Realize what you truly are",
    guidance:
      "Generate a spiritual/contemplative prompt tailored to the walker's beliefs or spiritual practice they shared.",
  },
  {
    id: 5,
    title: "Celebration",
    subtitle: "Raise your vibration",
    guidance:
      "Generate a joyful, celebratory prompt that references things that make this person feel alive and grateful.",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers } = await req.json();

    if (!answers || typeof answers !== "object") {
      return new Response(
        JSON.stringify({ error: "answers object is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const answersText = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPrompt = `You are a meditation and walking practice guide for "The Perfect Walk" — a 25-minute morning walking practice with 5 phases. 

Based on what someone has shared about their life, generate deeply personal, warm prompts for each phase. Each prompt should be 1-3 sentences that the walker will read at the start of each phase.

Be specific — reference actual details they shared (names of children, pets, career, hobbies, etc). Be warm but not cheesy. Sound like a wise friend, not a therapist.

Return a JSON object with keys "1" through "5", where each value is the personalized prompt string for that phase.`;

    const userPrompt = `Here's what this person shared about themselves:

${answersText}

Now generate personalized prompts for each of the 5 walking phases:
${PHASES.map((p) => `Phase ${p.id} — ${p.title}: ${p.guidance}`).join("\n")}

Return ONLY a JSON object like {"1": "...", "2": "...", "3": "...", "4": "...", "5": "..."}`;

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
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "set_phase_prompts",
                description: "Set the personalized prompts for each walk phase",
                parameters: {
                  type: "object",
                  properties: {
                    "1": { type: "string", description: "Opening Your Heart prompt" },
                    "2": { type: "string", description: "Feeling Your Power prompt" },
                    "3": { type: "string", description: "Letting Go prompt" },
                    "4": { type: "string", description: "Connecting with Source prompt" },
                    "5": { type: "string", description: "Celebration prompt" },
                  },
                  required: ["1", "2", "3", "4", "5"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "set_phase_prompts" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in AI response");
    }

    const prompts = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-walk-prompts error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
