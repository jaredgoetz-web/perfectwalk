import { useRef, useCallback } from "react";

const COACH_VOICE_ID = "dAUhldnXM7Bt5luFXmMZ";
const VOLUME_KEY = "tpw_coach_volume";
const MAX_GAIN = 20;
const MUSIC_DUCK_LEVEL = 0.15; // music drops to 15% while coach speaks
const DUCK_FADE_MS = 600; // fade duration

export function getCoachVolume(): number {
  const saved = localStorage.getItem(VOLUME_KEY);
  return saved ? parseFloat(saved) : 0.8;
}

export function setCoachVolume(vol: number) {
  localStorage.setItem(VOLUME_KEY, String(Math.max(0, Math.min(1, vol))));
}

/**
 * Hook for speaking coach guidance prompts via ElevenLabs TTS.
 * Supports music ducking — pass a ref to the music audio element.
 */
export function useCoachVoice() {
  const abortRef = useRef<AbortController | null>(null);
  const isSpeakingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicElementRef = useRef<HTMLAudioElement | null>(null);
  const duckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setMusicElement = useCallback((el: HTMLAudioElement | null) => {
    musicElementRef.current = el;
  }, []);

  // Smoothly duck/restore music volume
  const duckMusic = useCallback(() => {
    const music = musicElementRef.current;
    if (!music) return;
    const startVol = music.volume;
    const target = MUSIC_DUCK_LEVEL;
    const steps = 20;
    const stepTime = DUCK_FADE_MS / steps;
    const delta = (target - startVol) / steps;
    let step = 0;
    if (duckIntervalRef.current) clearInterval(duckIntervalRef.current);
    duckIntervalRef.current = setInterval(() => {
      step++;
      music.volume = Math.max(0, Math.min(1, startVol + delta * step));
      if (step >= steps) {
        if (duckIntervalRef.current) clearInterval(duckIntervalRef.current);
        duckIntervalRef.current = null;
        music.volume = target;
      }
    }, stepTime);
  }, []);

  const restoreMusic = useCallback(() => {
    const music = musicElementRef.current;
    if (!music) return;
    const startVol = music.volume;
    const target = 1;
    const steps = 20;
    const stepTime = DUCK_FADE_MS / steps;
    const delta = (target - startVol) / steps;
    let step = 0;
    if (duckIntervalRef.current) clearInterval(duckIntervalRef.current);
    duckIntervalRef.current = setInterval(() => {
      step++;
      music.volume = Math.max(0, Math.min(1, startVol + delta * step));
      if (step >= steps) {
        if (duckIntervalRef.current) clearInterval(duckIntervalRef.current);
        duckIntervalRef.current = null;
        music.volume = target;
      }
    }, stepTime);
  }, []);

  const warmup = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (error) {
        console.debug("Coach source already stopped", error);
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    isSpeakingRef.current = false;
    restoreMusic();
  }, [restoreMusic]);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim()) return;
      stop();

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

      // Duck the music
      duckMusic();

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
            body: JSON.stringify({ text: clean, voiceId: COACH_VOICE_ID, style: "coaching" }),
            signal: controller.signal,
          },
        );

        if (!response.ok) throw new Error(`TTS ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        if (controller.signal.aborted) return;

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") await ctx.resume();

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (controller.signal.aborted) return;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = getCoachVolume() * MAX_GAIN;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        sourceRef.current = source;

        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start(0);
        });
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Coach voice error:", err);
        }
      } finally {
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        abortRef.current = null;
        isSpeakingRef.current = false;
        // Restore music volume
        restoreMusic();
      }
    },
    [stop, duckMusic, restoreMusic],
  );

  return { speak, stop, warmup, setMusicElement, isSpeakingRef };
}
