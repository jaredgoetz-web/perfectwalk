import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import heartBg from "@/assets/phase-heart-bg.jpg";
import { Play, Pause, SkipForward, Check, X, ListMusic, Sparkles, ChevronRight, Music2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalkPhaseCard, { walkPhases } from "@/components/WalkPhaseCard";
import { saveWalkEntry, WalkEntry } from "@/lib/walkStore";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { isLoggedIn as isSpotifyLoggedIn, loginWithSpotify, logout as spotifyLogout, fetchSpotifyProfile } from "@/lib/spotifyAuth";
import {
  songLibrary,
  getSongsByPhase,
  loadPlaylists,
  loadUserSongs,
  CustomPlaylist,
  Song,
} from "@/lib/songLibrary";

interface PhaseMedia {
  type: "audio" | "spotify";
  audioSrc?: string;
  spotifyTrackId?: string;
  title: string;
}

function songToMedia(song: Song): PhaseMedia {
  if (song.spotifyTrackId) {
    return { type: "spotify", spotifyTrackId: song.spotifyTrackId, title: song.title };
  }
  return { type: "audio", audioSrc: song.audioSrc, title: song.title };
}

type Screen = "pick" | "walking";

const Walk = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("pick");
  const [isWalking, setIsWalking] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Spotify state
  const [spotifyConnected, setSpotifyConnected] = useState(isSpotifyLoggedIn());
  const [spotifyName, setSpotifyName] = useState<string | null>(null);
  const [spotifyIsPremium, setSpotifyIsPremium] = useState(false);
  const spotify = useSpotifyPlayer();

  // Fetch Spotify profile on mount
  useEffect(() => {
    if (spotifyConnected) {
      fetchSpotifyProfile().then((profile) => {
        if (profile) {
          setSpotifyName(profile.display_name);
          setSpotifyIsPremium(profile.product === "premium");
        }
      });
    }
  }, [spotifyConnected]);

  // Selected playlist media map: phaseIndex → PhaseMedia
  const [phaseMedia, setPhaseMedia] = useState<Record<number, PhaseMedia>>({});

  // Build default media map (first song per phase)
  const defaultMedia = useMemo(() => {
    const map: Record<number, PhaseMedia> = {};
    walkPhases.forEach((phase, idx) => {
      const songs = getSongsByPhase(phase.id);
      if (songs.length > 0) map[idx] = songToMedia(songs[0]);
    });
    return map;
  }, []);

  const myPlaylists = useMemo(() => loadPlaylists(), []);

  const selectPlaylist = (mediaMap: Record<number, PhaseMedia>) => {
    setPhaseMedia(mediaMap);
    setScreen("walking");
  };

  const selectDefault = () => selectPlaylist(defaultMedia);

  const selectCustom = (pl: CustomPlaylist) => {
    const allSongs = [...songLibrary, ...loadUserSongs()];
    const map: Record<number, PhaseMedia> = {};
    pl.songIds.forEach((songId) => {
      const song = allSongs.find((s) => s.id === songId);
      if (song) {
        const phaseIdx = walkPhases.findIndex((p) => p.id === song.phaseId);
        if (phaseIdx >= 0) map[phaseIdx] = songToMedia(song);
      }
    });
    selectPlaylist(map);
  };

  const selectNoMusic = () => {
    setPhaseMedia({});
    setScreen("walking");
  };

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isWalking) {
      interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isWalking]);

  // Determine if we should use Spotify SDK for current track
  const currentMedia = phaseMedia[currentPhase];
  const useSDK = spotifyConnected && spotifyIsPremium && spotify.isReady && currentMedia?.type === "spotify";

  // Audio playback (only for non-Spotify or fallback)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!useSDK && currentMedia?.type === "audio" && currentMedia.audioSrc) {
      if (!audio.src.endsWith(currentMedia.audioSrc)) {
        audio.src = currentMedia.audioSrc;
      }
      if (isWalking) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = "";
    }
  }, [isWalking, currentPhase, currentMedia, useSDK]);

  // Spotify SDK playback
  useEffect(() => {
    if (!useSDK || !currentMedia?.spotifyTrackId) return;
    if (isWalking) {
      spotify.play(`spotify:track:${currentMedia.spotifyTrackId}`);
    } else {
      spotify.pause();
    }
  }, [isWalking, currentPhase, useSDK, currentMedia?.spotifyTrackId]);

  // Auto-advance on track end (SDK)
  useEffect(() => {
    if (!useSDK) return;
    spotify.onTrackEnd(() => {
      if (currentPhase < walkPhases.length - 1) {
        handleNextPhase();
      }
    });
  }, [useSDK, currentPhase]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => setIsWalking(true);
  const handlePause = () => setIsWalking(false);

  const handleNextPhase = useCallback(() => {
    if (!completedPhases.includes(walkPhases[currentPhase].id)) {
      setCompletedPhases((prev) => [...prev, walkPhases[currentPhase].id]);
    }
    if (currentPhase < walkPhases.length - 1) {
      setCurrentPhase((p) => p + 1);
    }
  }, [currentPhase, completedPhases]);

  // Auto-advance when audio song ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (currentPhase < walkPhases.length - 1) {
        handleNextPhase();
      }
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [currentPhase, handleNextPhase]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const handleFinish = () => {
    setIsWalking(false);
    spotify.pause();
    const entry: WalkEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: Math.round(elapsed / 60),
      completedPhases: [...completedPhases, walkPhases[currentPhase].id],
    };
    saveWalkEntry(entry);
    navigate(`/journal/new?walkId=${entry.id}`);
  };

  const handleCancel = () => {
    if (screen === "walking" && elapsed > 0 && !window.confirm("End your walk without saving?")) return;
    spotify.pause();
    if (screen === "walking" && elapsed === 0) {
      setScreen("pick");
      return;
    }
    navigate("/");
  };

  const handleSpotifyConnect = () => loginWithSpotify("/walk");
  const handleSpotifyDisconnect = () => {
    spotifyLogout();
    setSpotifyConnected(false);
    setSpotifyName(null);
    setSpotifyIsPremium(false);
  };

  const phase = walkPhases[currentPhase];
  const Icon = phase.icon;

  // ─── Playlist Picker Screen ───
  if (screen === "pick") {
    return (
      <div className="min-h-screen pb-24">
        <div className="flex items-center justify-between px-5 pt-5">
          <button onClick={() => navigate("/")} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-semibold text-foreground">Choose Music</span>
          <div className="w-9" />
        </div>

        <div className="mx-auto max-w-lg px-5 mt-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-display text-2xl font-bold text-foreground text-center">
              Pick Your Playlist
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-center">
              Select the soundtrack for your walk
            </p>
          </motion.div>

          {/* Spotify Connect Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="mt-6"
          >
            {spotifyConnected ? (
              <div className="flex items-center gap-3 rounded-xl bg-[hsl(141,70%,45%)]/10 border border-[hsl(141,70%,45%)]/20 px-4 py-3">
                <Music2 className="h-5 w-5 text-[hsl(141,70%,45%)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Spotify Connected
                    {spotifyName && <span className="text-muted-foreground"> · {spotifyName}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {spotifyIsPremium ? "Premium · Full tracks enabled" : "Free tier · 30s previews only"}
                  </p>
                </div>
                <button onClick={handleSpotifyDisconnect} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSpotifyConnect}
                className="flex w-full items-center gap-3 rounded-xl bg-[hsl(141,70%,38%)] px-4 py-3.5 shadow-lg shadow-[hsl(141,70%,38%)]/30 transition-all hover:bg-[hsl(141,70%,42%)] hover:shadow-xl hover:shadow-[hsl(141,70%,38%)]/40"
              >
                <Music2 className="h-5 w-5 text-white" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">Connect Spotify</p>
                  <p className="text-xs text-white/70">Play full tracks with Premium</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/70" />
              </button>
            )}
          </motion.div>

          <div className="mt-6 space-y-3">
            {/* Default / curated */}
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={selectDefault}
              className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-warm text-left transition-all hover:shadow-elevated"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg gradient-sunrise">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-foreground">The Perfect Walk</p>
                <p className="text-sm text-muted-foreground">Curated journey · All 5 phases</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </motion.button>

            {/* Custom playlists */}
            {myPlaylists.map((pl, i) => (
              <motion.button
                key={pl.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => selectCustom(pl)}
                className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-warm text-left transition-all hover:shadow-elevated"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <ListMusic className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold text-foreground truncate">{pl.name}</p>
                  <p className="text-sm text-muted-foreground">{pl.songIds.length} songs</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </motion.button>
            ))}

            {/* No music option */}
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + myPlaylists.length * 0.05 }}
              onClick={selectNoMusic}
              className="flex w-full items-center gap-4 rounded-xl border border-dashed border-border p-4 text-left transition-all hover:bg-secondary"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Pause className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-foreground">Walk in Silence</p>
                <p className="text-sm text-muted-foreground">No music, just presence</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </motion.button>

            {/* Create new playlist link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex justify-center pt-2"
            >
              <button
                onClick={() => navigate("/playlists")}
                className="text-sm font-medium text-primary hover:underline"
              >
                + Create New Playlist
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Walking Screen ───
  return (
    <div className="min-h-screen pb-24">
      <audio ref={audioRef} preload="auto" />
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <button onClick={handleCancel} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <span className="font-display text-lg font-semibold text-foreground">
          {isWalking ? "Walking" : "Ready"}
        </span>
        <div className="w-9" />
      </div>

      {/* Timer */}
      <div className="relative mt-8 flex flex-col items-center overflow-hidden rounded-3xl mx-4 py-8">
        <img src={heartBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-background/50" />
        <motion.div
          key={currentPhase}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-secondary ${phase.color}`}
        >
          <Icon className="h-14 w-14" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 mt-6 text-center"
          >
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Phase {phase.id} of 5
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-foreground">
              {phase.title}
            </h2>
            <p className="mt-1 text-muted-foreground">{phase.subtitle}</p>
          </motion.div>
        </AnimatePresence>

        <p className="relative z-10 mt-6 font-display text-5xl font-bold tabular-nums text-foreground">
          {formatTime(elapsed)}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-center gap-4">
        {!isWalking && elapsed === 0 ? (
          <Button
            size="lg"
            onClick={handleStart}
            className="gradient-sunrise gap-2 rounded-full px-10 py-6 text-lg text-primary-foreground shadow-warm"
          >
            <Play className="h-5 w-5" />
            Begin Walk
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={isWalking ? handlePause : handleStart}
              className="h-14 w-14 rounded-full p-0"
            >
              {isWalking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            {currentPhase < walkPhases.length - 1 ? (
              <Button
                size="lg"
                onClick={handleNextPhase}
                className="gap-2 rounded-full px-6 py-6"
              >
                <SkipForward className="h-4 w-4" />
                Next Phase
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleFinish}
                className="gradient-sunrise gap-2 rounded-full px-6 py-6 text-primary-foreground shadow-warm"
              >
                <Check className="h-4 w-4" />
                Finish Walk
              </Button>
            )}
          </>
        )}
      </div>

      {/* Now playing info / Spotify embed */}
      {currentMedia && (
        <div className="mx-auto mt-6 max-w-lg px-5">
          {useSDK ? (
            // Full playback via Spotify SDK — show simple now-playing indicator
            <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 shadow-warm">
              <div className="h-2 w-2 rounded-full bg-[hsl(141,70%,45%)] animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Playing via Spotify:{" "}
                <span className="font-semibold text-foreground">{currentMedia.title}</span>
              </p>
            </div>
          ) : currentMedia.type === "spotify" && currentMedia.spotifyTrackId ? (
            <div className="rounded-xl overflow-hidden shadow-warm">
              <SpotifyEmbed trackId={currentMedia.spotifyTrackId} compact={false} autoPlay={isWalking} />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 shadow-warm">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Now playing:{" "}
                <span className="font-semibold text-foreground">
                  {currentMedia.title}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Spotify error */}
      {spotify.error && (
        <div className="mx-auto mt-3 max-w-lg px-5">
          <p className="text-xs text-center text-muted-foreground">{spotify.error}</p>
        </div>
      )}

      {/* Phase list */}
      <div className="mx-auto mt-8 max-w-lg space-y-2 px-5">
        {walkPhases.map((p, i) => (
          <WalkPhaseCard
            key={p.id}
            phase={p}
            index={i}
            isActive={i === currentPhase}
            onClick={() => isWalking && setCurrentPhase(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default Walk;
