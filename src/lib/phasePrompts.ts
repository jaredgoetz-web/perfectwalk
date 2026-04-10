/**
 * Default phase guidance prompts — hardcoded, emotionally precise.
 * Each phase has multiple prompts that rotate randomly each walk.
 */

export type GuidanceMode = "minimal" | "moderate" | "rich";

const GUIDANCE_MODE_KEY = "tpw_guidance_mode";

export function getGuidanceMode(): GuidanceMode {
  return (localStorage.getItem(GUIDANCE_MODE_KEY) as GuidanceMode) || "moderate";
}

export function setGuidanceMode(mode: GuidanceMode) {
  localStorage.setItem(GUIDANCE_MODE_KEY, mode);
}

export const defaultPhasePrompts: Record<number, string[]> = {
  // Phase 1 — Opening Your Heart
  1: [
    "Think of someone you love completely. Don't think about love — feel it.",
    "What are you grateful for right now? Let it be simple. Let it be real.",
    "Soften your chest. Drop your shoulders. You're safe to open.",
    "Release yesterday. It's done. You're here now.",
    "Breathe into your heart. Let warmth spread from the center of your chest.",
  ],
  // Phase 2 — Feeling Your Power
  2: [
    "Walk like you already are who you're becoming.",
    "You've survived everything that tried to stop you. Feel that.",
    "Open your chest. Lengthen your stride. This is your power.",
    "Remember who you are beneath the noise.",
    "You are not fragile. You are capable of extraordinary things.",
  ],
  // Phase 3 — Connecting with God / Source
  3: [
    "What wants to come through you today? Listen instead of think.",
    "You are not doing this alone. Feel that truth.",
    "Surrender the plan. Trust the path.",
    "What is true beneath the noise right now?",
    "There is an intelligence holding all of this together. You are part of it.",
  ],
  // Phase 4 — Letting Go / Total Presence
  4: [
    "Drop the story. Nothing to solve right now.",
    "Feel your feet. Feel the air. Be here.",
    "Let the feeling lead. Stop managing it.",
    "Nothing is required of you in this moment except to be alive.",
    "Release the grip. Let this moment be exactly what it is.",
  ],
  // Phase 5 — Celebration
  5: [
    "You showed up. That matters more than you know.",
    "Feel gratitude for your body, your path, this day.",
    "You are becoming. Celebrate that.",
    "Carry this energy forward. You earned it.",
    "This version of you — right here, right now — is worth celebrating.",
  ],
};

/**
 * Select a random prompt for a phase. Uses a session seed so the same
 * prompt stays consistent within a single walk but changes next walk.
 */
let sessionSeed: number | null = null;

function getSessionSeed(): number {
  if (sessionSeed === null) {
    sessionSeed = Date.now();
  }
  return sessionSeed;
}

export function resetSessionSeed() {
  sessionSeed = null;
}

export function getPhasePrompt(phaseId: number): string {
  const prompts = defaultPhasePrompts[phaseId];
  if (!prompts || prompts.length === 0) return "";
  // Simple hash from seed + phaseId to pick a consistent prompt per walk
  const seed = getSessionSeed();
  const index = (seed + phaseId * 7) % prompts.length;
  return prompts[index];
}

/**
 * Returns prompts to display based on guidance mode.
 * - minimal: no prompt text shown
 * - moderate: 1 prompt per phase (default)
 * - rich: 2 prompts per phase, rotated
 */
export function getPhaseGuidance(phaseId: number, mode: GuidanceMode): string[] {
  if (mode === "minimal") return [];

  const prompts = defaultPhasePrompts[phaseId];
  if (!prompts || prompts.length === 0) return [];

  const seed = getSessionSeed();
  const index = (seed + phaseId * 7) % prompts.length;

  if (mode === "moderate") {
    return [prompts[index]];
  }

  // rich: return 2 prompts
  const second = (index + 1) % prompts.length;
  return [prompts[index], prompts[second]];
}
