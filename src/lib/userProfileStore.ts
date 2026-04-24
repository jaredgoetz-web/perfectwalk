import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";

export interface UserProfileState {
  onboarded: boolean;
  personalized: boolean;
  spiritualLanguage: string;
  futureSelf: string;
  completedPhases: number[];
  phasePrompts: Record<string, string>;
  personalizationAnswers: Record<string, string>;
}

const DEFAULT_PROFILE: UserProfileState = {
  onboarded: false,
  personalized: false,
  spiritualLanguage: "Truth",
  futureSelf: "",
  completedPhases: [],
  phasePrompts: {},
  personalizationAnswers: {},
};

const STORAGE_KEYS = {
  onboarded: "tpw_onboarded",
  personalized: "tpw_personalized",
  spiritualLanguage: "tpw_spiritual_language",
  futureSelf: "tpw_future_self",
  completedPhases: "tpw_completed_phases",
  phasePrompts: "tpw_phase_prompts",
  personalizationAnswers: "tpw_personalization_answers",
} as const;

export const USER_PROFILE_QUERY_KEY = ["user-profile"] as const;

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readLegacyProfile(): UserProfileState {
  return {
    onboarded: localStorage.getItem(STORAGE_KEYS.onboarded) === "true",
    personalized: localStorage.getItem(STORAGE_KEYS.personalized) === "true",
    spiritualLanguage: localStorage.getItem(STORAGE_KEYS.spiritualLanguage) || DEFAULT_PROFILE.spiritualLanguage,
    futureSelf: localStorage.getItem(STORAGE_KEYS.futureSelf) || "",
    completedPhases: safeJsonParse<number[]>(localStorage.getItem(STORAGE_KEYS.completedPhases), []),
    phasePrompts: safeJsonParse<Record<string, string>>(localStorage.getItem(STORAGE_KEYS.phasePrompts), {}),
    personalizationAnswers: safeJsonParse<Record<string, string>>(localStorage.getItem(STORAGE_KEYS.personalizationAnswers), {}),
  };
}

function writeLegacyProfile(profile: UserProfileState) {
  localStorage.setItem(STORAGE_KEYS.onboarded, String(profile.onboarded));
  localStorage.setItem(STORAGE_KEYS.personalized, String(profile.personalized));
  localStorage.setItem(STORAGE_KEYS.spiritualLanguage, profile.spiritualLanguage || DEFAULT_PROFILE.spiritualLanguage);
  localStorage.setItem(STORAGE_KEYS.futureSelf, profile.futureSelf || "");
  localStorage.setItem(STORAGE_KEYS.completedPhases, JSON.stringify(profile.completedPhases || []));
  localStorage.setItem(STORAGE_KEYS.phasePrompts, JSON.stringify(profile.phasePrompts || {}));
  localStorage.setItem(STORAGE_KEYS.personalizationAnswers, JSON.stringify(profile.personalizationAnswers || {}));
}

function normalizeRemoteProfile(payload: Record<string, unknown> | null | undefined): UserProfileState {
  if (!payload) return readLegacyProfile();

  const nestedAnswers = payload.personalizationAnswers;
  const fallbackAnswers = payload.answers;
  const personalizationAnswers =
    typeof nestedAnswers === "object" && nestedAnswers !== null
      ? (nestedAnswers as Record<string, string>)
      : typeof fallbackAnswers === "object" && fallbackAnswers !== null
        ? (fallbackAnswers as Record<string, string>)
        : {};

  const nestedPrompts = payload.phasePrompts;
  const fallbackPrompts = payload.phase_prompts;
  const phasePrompts =
    typeof nestedPrompts === "object" && nestedPrompts !== null
      ? (nestedPrompts as Record<string, string>)
      : typeof fallbackPrompts === "object" && fallbackPrompts !== null
        ? (fallbackPrompts as Record<string, string>)
        : {};

  return {
    ...DEFAULT_PROFILE,
    onboarded: Boolean(payload.onboarded),
    personalized: Boolean(payload.personalized),
    spiritualLanguage: typeof payload.spiritualLanguage === "string"
      ? payload.spiritualLanguage
      : typeof payload.spiritual_language === "string"
        ? (payload.spiritual_language as string)
        : DEFAULT_PROFILE.spiritualLanguage,
    futureSelf: typeof payload.futureSelf === "string"
      ? payload.futureSelf
      : typeof payload.future_self === "string"
        ? (payload.future_self as string)
        : "",
    completedPhases: Array.isArray(payload.completedPhases)
      ? (payload.completedPhases as number[])
      : Array.isArray(payload.completed_phases)
        ? (payload.completed_phases as number[])
        : [],
    phasePrompts,
    personalizationAnswers,
  };
}

async function fetchRemoteProfile(): Promise<UserProfileState | null> {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from("user_personalization")
    .select("answers, phase_prompts")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) throw error;
  return normalizeRemoteProfile({
    ...((data?.answers as Record<string, unknown> | null | undefined) ?? {}),
    phase_prompts: data?.phase_prompts ?? undefined,
  });
}

export async function migrateLegacyProfile(): Promise<void> {
  const legacy = readLegacyProfile();
  const hasLegacyData =
    legacy.onboarded ||
    legacy.personalized ||
    legacy.futureSelf ||
    legacy.completedPhases.length > 0 ||
    Object.keys(legacy.phasePrompts).length > 0 ||
    Object.keys(legacy.personalizationAnswers).length > 0 ||
    legacy.spiritualLanguage !== DEFAULT_PROFILE.spiritualLanguage;

  if (!hasLegacyData) return;
  await saveUserProfile(legacy);
}

export async function getUserProfile(): Promise<UserProfileState> {
  try {
    await migrateLegacyProfile();
    const remote = await fetchRemoteProfile();
    const profile = remote ?? readLegacyProfile();
    writeLegacyProfile(profile);
    return profile;
  } catch (error) {
    console.error("Falling back to legacy profile storage", error);
    return readLegacyProfile();
  }
}

export async function saveUserProfile(updates: Partial<UserProfileState>): Promise<UserProfileState> {
  const merged = {
    ...(await getUserProfile()),
    ...updates,
  };

  writeLegacyProfile(merged);

  const { error } = await supabase.from("user_personalization").upsert(
    {
      device_id: getDeviceId(),
      answers: {
        onboarded: merged.onboarded,
        personalized: merged.personalized,
        spiritualLanguage: merged.spiritualLanguage,
        futureSelf: merged.futureSelf,
        completedPhases: merged.completedPhases,
        phasePrompts: merged.phasePrompts,
        personalizationAnswers: merged.personalizationAnswers,
      },
      phase_prompts: merged.phasePrompts,
    },
    { onConflict: "device_id" },
  );

  if (error) throw error;
  return merged;
}

export function useUserProfile() {
  return useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: getUserProfile,
    staleTime: 15_000,
  });
}

export function useRefreshUserProfile() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });
}
