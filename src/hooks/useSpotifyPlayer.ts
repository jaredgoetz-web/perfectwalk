import { useState, useEffect, useRef, useCallback } from "react";
import { getAccessToken, isLoggedIn } from "@/lib/spotifyAuth";

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface UseSpotifyPlayerReturn {
  isReady: boolean;
  isPremium: boolean;
  deviceId: string | null;
  play: (trackUri: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  onTrackEnd: (cb: () => void) => void;
  error: string | null;
}

export function useSpotifyPlayer(): UseSpotifyPlayerReturn {
  const [isReady, setIsReady] = useState(false);
  const [isPremium, setIsPremium] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const trackEndCb = useRef<(() => void) | null>(null);
  const prevTrackUri = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;

    let cancelled = false;

    const initPlayer = async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;

      // Load SDK script if needed
      if (!window.Spotify) {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        await new Promise<void>((resolve) => {
          window.onSpotifyWebPlaybackSDKReady = resolve;
        });
      }

      if (cancelled) return;

      const player = new window.Spotify.Player({
        name: "Perfect Walk",
        getOAuthToken: async (cb: (t: string) => void) => {
          const t = await getAccessToken();
          cb(t || "");
        },
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        if (cancelled) return;
        setDeviceId(device_id);
        setIsReady(true);
      });

      player.addListener("not_ready", () => {
        setIsReady(false);
        setDeviceId(null);
      });

      player.addListener("initialization_error", ({ message }: { message: string }) => {
        setError(message);
      });

      player.addListener("authentication_error", ({ message }: { message: string }) => {
        setError(message);
        setIsPremium(false);
      });

      player.addListener("account_error", ({ message }: { message: string }) => {
        setError("Spotify Premium is required for full playback");
        setIsPremium(false);
      });

      // Detect track end
      player.addListener("player_state_changed", (state: any) => {
        if (!state) return;
        const { position, duration, paused, track_window } = state;
        const currentUri = track_window?.current_track?.uri;

        // Track ended: position 0, paused, and we were playing something
        if (paused && position === 0 && prevTrackUri.current && currentUri === prevTrackUri.current && duration > 0) {
          // Could be end-of-track
          trackEndCb.current?.();
        }
        if (!paused && currentUri) {
          prevTrackUri.current = currentUri;
        }
      });

      const connected = await player.connect();
      if (!connected) {
        setError("Failed to connect to Spotify");
      }
      playerRef.current = player;
    };

    initPlayer();

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
      setIsReady(false);
      setDeviceId(null);
    };
  }, []);

  const play = useCallback(
    async (trackUri: string) => {
      if (!deviceId) return;
      const token = await getAccessToken();
      if (!token) return;

      prevTrackUri.current = trackUri;

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
      });
    },
    [deviceId]
  );

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    playerRef.current?.resume();
  }, []);

  const onTrackEnd = useCallback((cb: () => void) => {
    trackEndCb.current = cb;
  }, []);

  return { isReady, isPremium, deviceId, play, pause, resume, onTrackEnd, error };
}
