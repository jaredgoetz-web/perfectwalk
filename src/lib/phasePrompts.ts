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
    "Bring your attention to your heart. Breathe into it. Think of someone you love, a child, a pet, anyone who fills your heart. Use them as an anchor point to feel that love. Once you feel it, let go of the thought, and just stay in the feeling. Let it build.",
    "Fall in love with life right now. Fall in love with every step, every breath, the air on your skin. When you live in love, doors open, life gets easy, coincidences multiply. You become magnetic.",
    "Turn that love inward. Love yourself for getting up this morning, for making the tough decision to get out and do this. When you fall in love with yourself, it becomes so much easier to keep promises to yourself.",
    "Feel the area in the middle of your chest. Keep your attention there. With every step, fall deeper in love with this moment, deeper in love with yourself, deeper in love with everything around you. Let the goosebumps come.",
    "There's no better way to start your day than falling in love with life all over again. If it's cold out, fall in love with that crisp air. If the sun is shining, fall in love with the warmth. No matter what it is, you are so grateful to be here.",
  ],
  // Phase 2 — Feeling Your Power
  2: [
    "There's a giant inside of you. This giant has been shackled by scrolling on your phone, by numbing yourself, by comfort seeking. But it's in there and it's ready to come out. Squeeze your fists. Take firm, strong steps. This is your time to awaken it.",
    "Walk like the version of yourself that could walk into any room and take on any challenge. Nothing can get in your way when this giant is awake. You are wide awake and you're exploding with energy and there's nothing that can stop you.",
    "You're going to be a trillion miles tall. Filled with trillions of volts of electricity. Every single step, you're moving the universe around you. You are an all powerful being connected to everything that there is.",
    "When this giant is awake, fears and obstacles become just another thing to deal with. They don't cripple you. You become bulletproof. This version of you is who you always imagined you'd become.",
    "This power is compounding. Every time you do this, you feel it five times stronger. Then ten times. Then a hundred. You're going to get exponentially more powerful every single time you take this walk.",
  ],
  // Phase 3 — Letting Go / Total Presence
  3: [
    "Let go of any problems or stresses that your mind has been holding on to. Let go of any judgment about anything going on in your life. Let go of any attachment to outcome. Bring your attention to the present moment and just enjoy it.",
    "There is no past. There is no future. Both are illusions. Your past is just your mind's perception, littered with judgments. Your future is just your mind's way of trying to protect you. All that exists is right now.",
    "Your mind is always looking for something to hold on to, to make you feel okay. But when you let go, you realize you don't need any of that to be your truest self. Just notice each step, each breath, each sound.",
    "Whatever energetic code you're emitting right now, you will go down that path. You don't need your mind to bring you there. By keeping your attention in the present moment, you're doing the work.",
    "Letting go is not being irresponsible. Letting go is the only way to be responsible. When you let go of your ego's attachments, you find peace, connection, and clarity. Your body restores its balance. Just be here.",
  ],
  // Phase 4 — Connecting with Higher Power
  4: [
    "You are more than your mind. You are more than your thoughts. You're more than what you see, touch, taste, smell and hear. The only thing separating you from the infinite is your mind. Feel that connection now.",
    "Whatever higher power you believe in, this is your time with it. If you believe in God, this is your time with God. If you believe in Source, in the universe, in truth, this is your time to feel that connection deeply.",
    "We are all part of one collective consciousness experiencing creation through different lenses. There's no end to growth here. Let go and receive the answers. Don't attach to outcome, just listen.",
    "Notice everything around you. It's all part of your experience, part of your being, part of your field. You are everything around you. When you break free of the shackles of your mind, you open up to the divine, to the infinite.",
    "In this state you can create, you can manifest. You can live in love, joy, and bliss because you realize that's all that matters. Everything you could have wanted comes to you like a magnet. It's easy. It's no force.",
  ],
  // Phase 5 — Celebration
  5: [
    "Welcome to your closing ceremony. You just did this whole process for yourself first thing in the morning. You should feel a sense of joy, of contentment. Celebrate the fact that you took the proper action for yourself today.",
    "When you celebrate, your frequency raises, your energy rises. And then you celebrate that your energy is rising, and it rises even more. It's a never ending cycle. There is no limit to how good you can feel.",
    "Walk with a sense of celebration. Fast, big, high, strong. You've activated all of your energy centers for the day. Now it's up to the universe to shape and shift around you to create what you're ready for.",
    "You're building a foundational practice and a habit that can never let you down. Celebrate that. Celebrate your family, your challenges, your ability to be here. In the energy of celebration, there is no limit to what you can feel.",
    "Bring your energy so high you feel the goosebumps moving up into your head. Higher and higher. This might be the best you've ever felt. And guess what? You could feel infinitely better. You walk in the state of unlimited.",
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
