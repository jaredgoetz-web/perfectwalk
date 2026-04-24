import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const phases = [
  {
    id: 1,
    title: "Opening Your Heart",
    guidance:
      "Generate a deeply personal prompt that helps the walker open their heart. Reference specific people, pets, or things they love based on their answers.",
  },
  {
    id: 2,
    title: "Feeling Your Power",
    guidance:
      "Generate a motivating prompt that connects to the walker's strengths, career, passions, or achievements they shared.",
  },
  {
    id: 3,
    title: "Letting Go",
    guidance:
      "Generate a calming prompt that helps the walker release specific stresses or worries they mentioned. Guide them into presence.",
  },
  {
    id: 4,
    title: "Connecting with Source",
    guidance:
      "Generate a spiritual or contemplative prompt tailored to the walker's beliefs or spiritual practice they shared.",
  },
  {
    id: 5,
    title: "Celebration",
    guidance:
      "Generate a joyful prompt that references things that make this person feel alive and grateful.",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers } = await req.json();

    if (!answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ error: "answers object is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const answersText = Object.entries(answers as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join("\n");

    const systemPrompt = `You are a meditation and walking guide for The Perfect Walk, a five-phase morning ritual. Generate deeply personal, warm prompts for each phase. Each prompt should be 1-3 sentences. Reference concrete details the person shared. Return only valid JSON.`;

    const userPrompt = `Here is what this person shared:

${answersText}

Generate personalized prompts for each phase:
${phases.map((phase) => `Phase ${phase.id} — ${phase.title}: ${phase.guidance}`).join("\n")}

Return only a JSON object like {"1":"...","2":"...","3":"...","4":"...","5":"..."}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("AI gateway error:", response.status, body);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("AI did not return prompt JSON");
    }

    const prompts = JSON.parse(content) as Record<string, string>;

    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-walk-prompts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
