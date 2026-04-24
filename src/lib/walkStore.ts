import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { getCurrentUserId } from "@/lib/auth";
import { getDeviceId } from "@/lib/deviceId";

export interface WalkEntry {
  id: string;
  date: string;
  duration: number;
  journalEntry?: string;
  mood?: "amazing" | "great" | "good" | "neutral" | "tough";
  completedPhases: number[];
  reflectionQ1?: string;
  reflectionQ2?: string;
  reflectionQ3?: string;
}

interface StorageIdentity {
  userId: string | null;
  deviceId: string;
}

const STORAGE_KEY = "perfect-walk-entries";
export const WALK_QUERY_KEY = ["walk-entries"] as const;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function ensureWalkEntryId(id: string): string {
  return isUuid(id) ? id : crypto.randomUUID();
}

function readLegacyWalkEntries(): WalkEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as WalkEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLegacyWalkEntries(entries: WalkEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function clearLegacyWalkEntries() {
  localStorage.removeItem(STORAGE_KEY);
}

function rowToWalkEntry(row: Tables<"walk_entries">): WalkEntry {
  return {
    id: row.id,
    date: row.date,
    duration: row.duration_minutes ?? 0,
    journalEntry: row.journal_entry ?? undefined,
    mood: (row.mood as WalkEntry["mood"] | null) ?? undefined,
    completedPhases: row.completed_phases ?? [],
    reflectionQ1: row.reflection_q1 ?? undefined,
    reflectionQ2: row.reflection_q2 ?? undefined,
    reflectionQ3: row.reflection_q3 ?? undefined,
  };
}

async function getStorageIdentity(): Promise<StorageIdentity> {
  return {
    userId: await getCurrentUserId(),
    deviceId: getDeviceId(),
  };
}

function walkEntryToRow(entry: WalkEntry, identity: StorageIdentity): TablesInsert<"walk_entries"> {
  return {
    id: ensureWalkEntryId(entry.id),
    user_id: identity.userId,
    device_id: identity.deviceId,
    date: entry.date,
    duration_minutes: entry.duration,
    completed_phases: entry.completedPhases,
    journal_entry: entry.journalEntry ?? null,
    mood: entry.mood ?? null,
    reflection_q1: entry.reflectionQ1 ?? null,
    reflection_q2: entry.reflectionQ2 ?? null,
    reflection_q3: entry.reflectionQ3 ?? null,
  };
}

async function fetchRemoteWalkEntries(identity: StorageIdentity): Promise<WalkEntry[]> {
  let query = supabase
    .from("walk_entries")
    .select("*");

  query = identity.userId ? query.eq("user_id", identity.userId) : query.eq("device_id", identity.deviceId);

  const { data, error } = await query.order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToWalkEntry);
}

export async function migrateLegacyWalkEntries(): Promise<void> {
  const identity = await getStorageIdentity();
  const legacy = readLegacyWalkEntries();
  if (legacy.length === 0) return;

  const payload = legacy.map((entry) => walkEntryToRow(entry, identity));
  const { error } = await supabase.from("walk_entries").upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("Failed to migrate walk entries", error);
    return;
  }

  clearLegacyWalkEntries();
}

export async function getWalkEntries(): Promise<WalkEntry[]> {
  try {
    const identity = await getStorageIdentity();
    await migrateLegacyWalkEntries();
    const remoteEntries = await fetchRemoteWalkEntries(identity);
    writeLegacyWalkEntries(remoteEntries);
    return remoteEntries;
  } catch (error) {
    console.error("Falling back to legacy walk storage", error);
    return readLegacyWalkEntries().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export async function saveWalkEntry(entry: WalkEntry): Promise<WalkEntry> {
  const identity = await getStorageIdentity();
  const normalizedEntry = { ...entry, id: ensureWalkEntryId(entry.id) };
  writeLegacyWalkEntries([normalizedEntry, ...readLegacyWalkEntries().filter((existing) => existing.id !== normalizedEntry.id)]);

  const { data, error } = await supabase
    .from("walk_entries")
    .upsert(walkEntryToRow(normalizedEntry, identity), { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return rowToWalkEntry(data);
}

export async function updateWalkEntry(id: string, updates: Partial<WalkEntry>): Promise<WalkEntry | null> {
  const identity = await getStorageIdentity();
  const existing = readLegacyWalkEntries();
  const current = existing.find((entry) => entry.id === id);
  const merged = current ? { ...current, ...updates } : null;
  if (merged) {
    writeLegacyWalkEntries(existing.map((entry) => (entry.id === id ? merged : entry)));
  }

  const payload: TablesInsert<"walk_entries"> = {
    id: ensureWalkEntryId(id),
    user_id: identity.userId,
    device_id: identity.deviceId,
    date: updates.date ?? current?.date ?? new Date().toISOString(),
    duration_minutes: updates.duration ?? current?.duration ?? 0,
    completed_phases: updates.completedPhases ?? current?.completedPhases ?? [],
    journal_entry: updates.journalEntry ?? current?.journalEntry ?? null,
    mood: updates.mood ?? current?.mood ?? null,
    reflection_q1: updates.reflectionQ1 ?? current?.reflectionQ1 ?? null,
    reflection_q2: updates.reflectionQ2 ?? current?.reflectionQ2 ?? null,
    reflection_q3: updates.reflectionQ3 ?? current?.reflectionQ3 ?? null,
  };

  const { data, error } = await supabase
    .from("walk_entries")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return rowToWalkEntry(data);
}

export function getStreakFromEntries(entries: WalkEntry[]): number {
  if (entries.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uniqueDates = [
    ...new Set(
      entries
        .map((entry) => {
          const date = new Date(entry.date);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
        .sort((a, b) => b - a),
    ),
  ];

  let streak = 0;
  let checkDate = today.getTime();

  for (const date of uniqueDates) {
    if (date === checkDate) {
      streak += 1;
      checkDate -= 86400000;
      continue;
    }

    if (date < checkDate) break;
  }

  return streak;
}

export function getTotalWalksFromEntries(entries: WalkEntry[]): number {
  return entries.length;
}

export function getTotalMinutesFromEntries(entries: WalkEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.duration, 0);
}

export function useWalkEntries() {
  return useQuery({
    queryKey: WALK_QUERY_KEY,
    queryFn: getWalkEntries,
    staleTime: 15_000,
  });
}

export function useRefreshWalkEntries() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: WALK_QUERY_KEY });
}

export const moodEmoji: Record<string, string> = {
  amazing: "✨",
  great: "🌟",
  good: "☀️",
  neutral: "🌤️",
  tough: "🌧️",
};
