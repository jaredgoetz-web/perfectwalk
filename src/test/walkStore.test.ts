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

import { getStreakFromEntries, getTotalMinutesFromEntries, getTotalWalksFromEntries, type WalkEntry } from "@/lib/walkStore";

function makeEntry(overrides: Partial<WalkEntry> = {}): WalkEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString(),
    duration: 25,
    completedPhases: [1, 2, 3, 4, 5],
    ...overrides,
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

describe("walkStore metrics", () => {
  it("computes totals from entries", () => {
    const entries = [makeEntry({ duration: 25 }), makeEntry({ duration: 18 }), makeEntry({ duration: 32 })];

    expect(getTotalWalksFromEntries(entries)).toBe(3);
    expect(getTotalMinutesFromEntries(entries)).toBe(75);
  });

  it("computes a consecutive streak from today backward", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(today.getDate() - 4);

    const entries = [
      makeEntry({ date: today.toISOString() }),
      makeEntry({ date: yesterday.toISOString() }),
      makeEntry({ date: twoDaysAgo.toISOString() }),
      makeEntry({ date: fourDaysAgo.toISOString() }),
    ];

    expect(getStreakFromEntries(entries)).toBe(3);
  });

  it("does not count a streak when there is no walk today", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const entries = [makeEntry({ date: yesterday.toISOString() })];

    expect(getStreakFromEntries(entries)).toBe(0);
  });
});
