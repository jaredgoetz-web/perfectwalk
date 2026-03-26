// Simple localStorage-based store for walk data

export interface WalkEntry {
  id: string;
  date: string;
  duration: number; // minutes
  journalEntry?: string;
  mood?: "amazing" | "great" | "good" | "neutral" | "tough";
  completedPhases: number[];
}

const STORAGE_KEY = "perfect-walk-entries";

export const getWalkEntries = (): WalkEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveWalkEntry = (entry: WalkEntry) => {
  const entries = getWalkEntries();
  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const updateWalkEntry = (id: string, updates: Partial<WalkEntry>) => {
  const entries = getWalkEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
};

export const getStreak = (): number => {
  const entries = getWalkEntries();
  if (entries.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = entries
    .map((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
    .sort((a, b) => b - a);

  const uniqueDates = [...new Set(dates)];
  let streak = 0;
  let checkDate = today.getTime();

  for (const date of uniqueDates) {
    if (date === checkDate) {
      streak++;
      checkDate -= 86400000;
    } else if (date < checkDate) {
      break;
    }
  }

  return streak;
};

export const getTotalWalks = (): number => getWalkEntries().length;

export const getTotalMinutes = (): number =>
  getWalkEntries().reduce((sum, e) => sum + e.duration, 0);

export const moodEmoji: Record<string, string> = {
  amazing: "✨",
  great: "🌟",
  good: "☀️",
  neutral: "🌤️",
  tough: "🌧️",
};
