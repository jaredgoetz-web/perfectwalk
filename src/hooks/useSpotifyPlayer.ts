import { useState, useEffect, useRef, useCallback } from "react";
import { getAccessToken, isLoggedIn } from "@/lib/spotifyAuth";

interface SpotifyPlayerState {
  position: number;
  duration: number;
  paused: boolean;
  track_window?: {
    current_track?: {
      uri?: string;
    };
  };
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (payload: unknown) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
}

interface SpotifySDK {
  Player: new (options: {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume: number;
  }) => SpotifyPlayer;
}

declare global {
  interface Window {
    Spotify?: SpotifySDK;
    onSpotifyWebPlaybackSDKReady?: () => void;
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
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const trackEndCb = useRef<(() => void) | null>(null);
  const prevTrackUri = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) return;

    let cancelled = false;

    const initPlayer = async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;

      if (!window.Spotify) {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        await new Promise<void>((resolve) => {
          window.onSpotifyWebPlaybackSDKReady = resolve;
        });
      }

      if (cancelled || !window.Spotify) return;

      const player = new window.Spotify.Player({
        name: "Perfect Walk",
        getOAuthToken: async (callback) => {
          const refreshedToken = await getAccessToken();
          callback(refreshedToken || "");
        },
        volume: 0.8,
      });

      player.addListener("ready", (payload) => {
        const { device_id } = payload as { device_id: string };
        if (cancelled) return;
        setDeviceId(device_id);
        setIsReady(true);
      });

      player.addListener("not_ready", () => {
        setIsReady(false);
        setDeviceId(null);
      });

      player.addListener("initialization_error", (payload) => {
        const { message } = payload as { message: string };
        setError(message);
      });

      player.addListener("authentication_error", (payload) => {
        const { message } = payload as { message: string };
        setError(message);
        setIsPremium(false);
      });

      player.addListener("account_error", () => {
        setError("Spotify Premium is required for full playback");
        setIsPremium(false);
      });

      player.addListener("player_state_changed", (payload) => {
        const state = payload as SpotifyPlayerState | null;
        if (!state) return;
        const { position, duration, paused, track_window } = state;
        const currentUri = track_window?.current_track?.uri;

        if (
          paused &&
          position === 0 &&
          prevTrackUri.current &&
          currentUri === prevTrackUri.current &&
          duration > 0
        ) {
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

    void initPlayer();

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
    [deviceId],
  );

  const pause = useCallback(() => {
    void playerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    void playerRef.current?.resume();
  }, []);

  const onTrackEnd = useCallback((cb: () => void) => {
    trackEndCb.current = cb;
  }, []);

  return { isReady, isPremium, deviceId, play, pause, resume, onTrackEnd, error };
}
