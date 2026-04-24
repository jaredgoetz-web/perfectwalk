import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Json } from "@/integrations/supabase/types";

const localState: Record<string, string> = {};
const supabaseMocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  getSession: vi.fn(),
}));

supabaseMocks.eq.mockImplementation(() => ({ maybeSingle: supabaseMocks.maybeSingle }));
supabaseMocks.select.mockImplementation(() => ({ eq: supabaseMocks.eq }));
supabaseMocks.from.mockImplementation(() => ({
  select: supabaseMocks.select,
  upsert: supabaseMocks.upsert,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: supabaseMocks.from,
    auth: {
      getSession: supabaseMocks.getSession,
    },
  },
}));

vi.mock("@/lib/deviceId", () => ({
  getDeviceId: () => "device-123",
}));

import { getUserProfile, saveUserProfile } from "@/lib/userProfileStore";

beforeEach(() => {
  Object.keys(localState).forEach((key) => delete localState[key]);
  vi.clearAllMocks();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => localState[key] ?? null,
    setItem: (key: string, value: string) => {
      localState[key] = value;
    },
    removeItem: (key: string) => {
      delete localState[key];
    },
  });

  supabaseMocks.eq.mockImplementation(() => ({ maybeSingle: supabaseMocks.maybeSingle }));
  supabaseMocks.select.mockImplementation(() => ({ eq: supabaseMocks.eq }));
  supabaseMocks.from.mockImplementation(() => ({
    select: supabaseMocks.select,
    upsert: supabaseMocks.upsert,
  }));

  supabaseMocks.maybeSingle.mockResolvedValue({
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
  });

  supabaseMocks.upsert.mockResolvedValue({ error: null });
});

describe("userProfileStore", () => {
  it("reads Supabase-backed profile data by authenticated user id when a session exists", async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
      error: null,
    });

    const profile = await getUserProfile();

    expect(profile.onboarded).toBe(true);
    expect(profile.futureSelf).toBe("I keep promises to myself.");
    expect(profile.phasePrompts["1"]).toBe("Open your heart");
    expect(supabaseMocks.eq).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("writes profile updates against the authenticated user id", async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
      error: null,
    });

    await saveUserProfile({ onboarded: true, spiritualLanguage: "Truth" });

    expect(supabaseMocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        device_id: "device-123",
      }),
      expect.objectContaining({ onConflict: "user_id" }),
    );
  });
});
