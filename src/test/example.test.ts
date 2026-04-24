import { beforeEach, describe, expect, it, vi } from "vitest";

const localState: Record<string, string> = {};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: [], error: null }),
        }),
      }),
      upsert: async () => ({ error: null }),
    }),
  },
}));

vi.mock("@/lib/deviceId", () => ({
  getDeviceId: () => "device-123",
}));

import { getStreakFromEntries, moodEmoji, type WalkEntry } from "@/lib/walkStore";

function entry(id: string, date: Date): WalkEntry {
  return {
    id,
    date: date.toISOString(),
    duration: 25,
    completedPhases: [1, 2, 3, 4, 5],
  };
}

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

describe("walkStore derived behavior", () => {
  it("does not double-count multiple walks on the same day in a streak", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const entries = [entry("a", today), entry("b", today), entry("c", yesterday)];

    expect(getStreakFromEntries(entries)).toBe(2);
  });

  it("exposes the expected mood emoji mapping", () => {
    expect(moodEmoji.amazing).toBe("✨");
    expect(moodEmoji.tough).toBe("🌧️");
  });
});
