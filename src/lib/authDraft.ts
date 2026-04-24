export interface SignupDraft {
  goals: string[];
  preferredWindow: "morning" | "midday" | "evening" | "anytime";
  walkDuration: "5-10" | "10-20" | "20+";
  spiritualLanguage: string;
}

const STORAGE_KEY = "tpw_signup_draft";

export function readSignupDraft(): SignupDraft | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SignupDraft;
  } catch {
    return null;
  }
}

export function saveSignupDraft(draft: SignupDraft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearSignupDraft() {
  localStorage.removeItem(STORAGE_KEY);
}
