import { useRef, useCallback } from "react";

const COACH_VOICE_ID = "dAUhldnXM7Bt5luFXmMZ";

/**
 * Hook for speaking coach guidance prompts via ElevenLabs TTS.
 * Audio plays through a separate Audio element so it layers over music.
 */
export function useCoachVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isSpeakingRef = useRef(false);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    isSpeakingRef.current = false;
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim()) return;

      // Stop any current speech
      stop();

      // Clean emoji from text
      const clean = text
        .replace(
          /[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu,
          "",
        )
        .trim();
      if (!clean) return;

      const controller = new AbortController();
      abortRef.current = controller;
      isSpeakingRef.current = true;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text: clean, voiceId: COACH_VOICE_ID }),
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error(`TTS ${response.status}`);

        const blob = await response.blob();
        if (controller.signal.aborted) return;

        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Coach voice error:", err);
        }
      } finally {
        // Cleanup
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
        abortRef.current = null;
        isSpeakingRef.current = false;
      }
    },
    [stop],
  );

  return { speak, stop, isSpeakingRef };
}
