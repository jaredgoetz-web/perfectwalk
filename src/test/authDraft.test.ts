import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearSignupDraft,
  readSignupDraft,
  saveSignupDraft,
  type SignupDraft,
} from "@/lib/authDraft";

const localState: Record<string, string> = {};

describe("authDraft", () => {
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

  it("persists and restores the signup draft", () => {
    const draft: SignupDraft = {
      goals: ["clarity", "confidence"],
      preferredWindow: "morning",
      walkDuration: "10-20",
      spiritualLanguage: "Truth",
    };

    saveSignupDraft(draft);

    expect(readSignupDraft()).toEqual(draft);
  });

  it("clears the saved signup draft", () => {
    saveSignupDraft({
      goals: ["clarity"],
      preferredWindow: "anytime",
      walkDuration: "5-10",
      spiritualLanguage: "Source",
    });

    clearSignupDraft();

    expect(readSignupDraft()).toBeNull();
  });
});
