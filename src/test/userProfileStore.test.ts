import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Json } from "@/integrations/supabase/types";

const localState: Record<string, string> = {};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      upsert: () => ({
        select: () => ({
          single: async () => ({
            data: {
              answers: {
                onboarded: true,
                futureSelf: "I keep promises to myself.",
                spiritualLanguage: "Source",
                personalized: true,
                personalizationAnswers: { name: "Jay" },
              } satisfies Record<string, Json>,
              phase_prompts: { 1: "Open your heart" } satisfies Record<string, Json>,
            },
            error: null,
          }),
        }),
      }),
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              answers: {
                onboarded: true,
                futureSelf: "I keep promises to myself.",
                spiritualLanguage: "Source",
                personalized: true,
                personalizationAnswers: { name: "Jay" },
              } satisfies Record<string, Json>,
              phase_prompts: { 1: "Open your heart" } satisfies Record<string, Json>,
            },
            error: null,
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/deviceId", () => ({
  getDeviceId: () => "device-123",
}));

import { getUserProfile } from "@/lib/userProfileStore";

beforeEach(() => {
  Object.keys(localState).forEach((key) => delete localState[key]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => localState[key] ?? null,
    setItem: (key: string, value: string) => {
      localState[key] = value;
    },
    removeItem: (key: string) => {
      delete localState[key];
    },
  });
});

describe("userProfileStore", () => {
  it("normalizes Supabase-backed profile data", async () => {
    const profile = await getUserProfile();

    expect(profile.onboarded).toBe(true);
    expect(profile.futureSelf).toBe("I keep promises to myself.");
    expect(profile.spiritualLanguage).toBe("Source");
    expect(profile.personalized).toBe(true);
    expect(profile.personalizationAnswers.name).toBe("Jay");
    expect(profile.phasePrompts["1"]).toBe("Open your heart");
  });
});
