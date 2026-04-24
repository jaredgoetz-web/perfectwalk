import { beforeEach, describe, expect, it, vi } from "vitest";

const localState: Record<string, string> = {};
const supabaseMocks = vi.hoisted(() => ({
  selectOrder: vi.fn(),
  selectEq: vi.fn(),
  select: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
  getSession: vi.fn(),
}));

supabaseMocks.selectEq.mockImplementation(() => ({ order: supabaseMocks.selectOrder }));
supabaseMocks.select.mockImplementation(() => ({ eq: supabaseMocks.selectEq }));
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

import {
  getStreakFromEntries,
  getTotalMinutesFromEntries,
  getTotalWalksFromEntries,
  saveWalkEntry,
  type WalkEntry,
} from "@/lib/walkStore";

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

  supabaseMocks.selectEq.mockImplementation(() => ({ order: supabaseMocks.selectOrder }));
  supabaseMocks.select.mockImplementation(() => ({ eq: supabaseMocks.selectEq }));
  supabaseMocks.from.mockImplementation(() => ({
    select: supabaseMocks.select,
    upsert: supabaseMocks.upsert,
  }));
  supabaseMocks.selectOrder.mockResolvedValue({ data: [], error: null });
  supabaseMocks.upsert.mockImplementation(() => ({
    select: () => ({
      single: async () => ({
        data: {
          id: "entry-1",
          date: new Date().toISOString(),
          duration_minutes: 25,
          completed_phases: [1, 2, 3],
          journal_entry: null,
          mood: null,
          reflection_q1: null,
          reflection_q2: null,
          reflection_q3: null,
        },
        error: null,
      }),
    }),
  }));
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

  it("writes walk entries against the authenticated user id", async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
      error: null,
    });

    await saveWalkEntry(makeEntry({ id: "11111111-1111-4111-8111-111111111111" }));

    expect(supabaseMocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        device_id: "device-123",
      }),
      expect.objectContaining({ onConflict: "id" }),
    );
  });
});
