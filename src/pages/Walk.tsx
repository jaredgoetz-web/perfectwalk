import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import heartBg from "@/assets/phase-heart-bg.jpg";
import { Play, Pause, SkipForward, Check, X, ListMusic, Sparkles, ChevronRight, Music2, LogOut, Volume2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalkPhaseCard, { walkPhases } from "@/components/WalkPhaseCard";
import { saveWalkEntry, type WalkEntry, useRefreshWalkEntries } from "@/lib/walkStore";
import { useUserProfile } from "@/lib/userProfileStore";
import {
  getPhaseGuidance,
  getGuidanceMode,
  setGuidanceMode,
  resetSessionSeed,
  GuidanceMode,
} from "@/lib/phasePrompts";
import { useCoachVoice, getCoachVolume, setCoachVolume } from "@/hooks/useCoachVoice";
import { phaseColorMap } from "@/lib/motionPresets";
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
  const { data: profile } = useUserProfile();
  const refreshWalkEntries = useRefreshWalkEntries();
  const [screen, setScreen] = useState<Screen>("pick");
  const [isWalking, setIsWalking] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [guidanceMode, setGuidanceModeState] = useState<GuidanceMode>(getGuidanceMode());
  const [coachSpeaking, setCoachSpeaking] = useState(false);
  const [coachVolume, setCoachVolumeState] = useState(getCoachVolume());
  const [showSettings, setShowSettings] = useState(false);
  const [phaseTransitioning, setPhaseTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const coach = useCoachVoice();
  const spokenPhasesRef = useRef<Set<number>>(new Set());
  const midPhaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect music audio element to coach for ducking
  useEffect(() => {
    coach.setMusicElement(audioRef.current);
  }, []);

  // Spotify state
  const [spotifyConnected, setSpotifyConnected] = useState(isSpotifyLoggedIn());
  const [spotifyName, setSpotifyName] = useState<string | null>(null);
  const [spotifyPlan, setSpotifyPlan] = useState<"checking" | "premium" | "free">(
    isSpotifyLoggedIn() ? "checking" : "free"
  );
  const spotify = useSpotifyPlayer();

  // Fetch Spotify profile on mount
  useEffect(() => {
    if (spotifyConnected) {
      setSpotifyPlan("checking");
      fetchSpotifyProfile().then((profile) => {
        if (profile) {
          setSpotifyName(profile.display_name);
          setSpotifyPlan(profile.product === "premium" ? "premium" : "free");
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
  const useSDK = spotifyConnected && spotifyPlan === "premium" && spotify.isReady && currentMedia?.type === "spotify";

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

  // ─── Coach Voice: speak guidance prompts over music ───
  // Triggers on phase change AND when walking starts (so phase 1 is never missed)
  useEffect(() => {
    if (!isWalking || guidanceMode === "minimal") return;
    const phaseId = walkPhases[currentPhase].id;

    // Don't repeat for a phase we already spoke
    if (spokenPhasesRef.current.has(phaseId)) return;
    spokenPhasesRef.current.add(phaseId);

    // Build what to say — speak like a voice from deep within
    const phaseName = walkPhases[currentPhase].title;

    // Get the primary prompt for this phase
    let prompt = profile?.phasePrompts?.[String(phaseId)] || "";
    if (!prompt) {
      const defaults = getPhaseGuidance(phaseId, "moderate");
      prompt = defaults[0] || "";
    }

    // Speak after a brief pause to let the phase transition settle
    const delay = currentPhase === 0 ? 3000 : 2000;
    const speakTimeout = setTimeout(async () => {
      // Phase 1 gets a warm opening; others get a gentle transition
      let speech: string;
      if (currentPhase === 0) {
        speech = `Let's begin. ${phaseName}. ... ${prompt}`;
      } else if (currentPhase === walkPhases.length - 1) {
        speech = `And now... ${phaseName}. ${prompt}`;
      } else {
        speech = `${phaseName}. ... ${prompt}`;
      }

      setCoachSpeaking(true);
      await coach.speak(speech);
      setCoachSpeaking(false);

      // In rich mode, speak a second prompt mid-phase (~90 seconds in)
      if (guidanceMode === "rich") {
        const defaults = getPhaseGuidance(phaseId, "rich");
        const secondPrompt = defaults[1] || defaults[0] || "";
        if (secondPrompt && secondPrompt !== prompt) {
          midPhaseTimerRef.current = setTimeout(async () => {
            setCoachSpeaking(true);
            await coach.speak(secondPrompt);
            setCoachSpeaking(false);
          }, 90_000);
        }
      }
    }, delay);

    return () => {
      clearTimeout(speakTimeout);
      if (midPhaseTimerRef.current) {
        clearTimeout(midPhaseTimerRef.current);
        midPhaseTimerRef.current = null;
      }
    };
  }, [currentPhase, isWalking, guidanceMode, profile?.phasePrompts]);

  // Stop coach voice on pause or unmount
  useEffect(() => {
    if (!isWalking) {
      coach.stop();
      setCoachSpeaking(false);
      if (midPhaseTimerRef.current) {
        clearTimeout(midPhaseTimerRef.current);
        midPhaseTimerRef.current = null;
      }
    }
  }, [isWalking]);

  useEffect(() => {
    return () => {
      coach.stop();
      if (midPhaseTimerRef.current) clearTimeout(midPhaseTimerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    // Unlock AudioContext on user gesture so coach voice works
    coach.warmup();
    if (elapsed === 0) {
      resetSessionSeed(); // new walk = new prompts
      spokenPhasesRef.current.clear(); // reset spoken phases for new walk
    }
    setIsWalking(true);
  };
  const handlePause = () => setIsWalking(false);

  const handleNextPhase = useCallback(() => {
    if (!completedPhases.includes(walkPhases[currentPhase].id)) {
      setCompletedPhases((prev) => [...prev, walkPhases[currentPhase].id]);
    }
    if (currentPhase < walkPhases.length - 1) {
      const nextIdx = currentPhase + 1;
      // Trigger full-screen transition moment
      setTransitionPhase(nextIdx);
      setPhaseTransitioning(true);
      setTimeout(() => {
        setCurrentPhase(nextIdx);
      }, 800);
      setTimeout(() => {
        setPhaseTransitioning(false);
        setTransitionPhase(null);
      }, 2200);
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

  const handleFinish = async () => {
    setIsWalking(false);
    spotify.pause();
    const savedEntry = await saveWalkEntry({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: Math.round(elapsed / 60),
      completedPhases: [...completedPhases, walkPhases[currentPhase].id],
    });
    refreshWalkEntries();
    navigate(`/journal/new?walkId=${savedEntry.id}`);
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
    setSpotifyPlan("free");
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
                    {spotifyPlan === "checking"
                      ? "Checking account status…"
                      : spotifyPlan === "premium"
                        ? "Premium · Full tracks enabled"
                        : "Free tier · 30s previews only"}
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

  // Get current guidance prompt
  const getPromptText = () => {
    if (guidanceMode === "minimal") return null;
    const p = profile?.phasePrompts?.[String(phase.id)];
    if (p) return p;
    const defaults = getPhaseGuidance(phase.id, "moderate");
    return defaults[0] || null;
  };

  const promptText = getPromptText();
  const phaseHsl = phaseColorMap[phase.id] || "32 80% 50%";

  // ─── Walking Screen — Immersive ───
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden transition-colors duration-1000"
      style={{
        background: `radial-gradient(ellipse at 50% 30%, hsl(${phaseHsl} / 0.08) 0%, hsl(var(--background)) 70%)`,
      }}
    >
      <audio ref={audioRef} preload="auto" />

      {/* Phase transition overlay */}
      <AnimatePresence>
        {phaseTransitioning && transitionPhase !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, hsl(${phaseColorMap[walkPhases[transitionPhase].id] || "32 80% 50%"} / 0.15) 0%, hsl(var(--background)) 70%)`,
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 18, delay: 0.2 }}
              className={`flex h-24 w-24 items-center justify-center rounded-full ${walkPhases[transitionPhase].color}`}
              style={{
                background: `hsl(${phaseColorMap[walkPhases[transitionPhase].id] || "32 80% 50%"} / 0.12)`,
                boxShadow: `0 0 60px -4px hsl(${phaseColorMap[walkPhases[transitionPhase].id] || "32 80% 50%"} / 0.4)`,
              }}
            >
              {(() => { const TIcon = walkPhases[transitionPhase].icon; return <TIcon className="h-10 w-10" />; })()}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="mt-6 font-display text-4xl font-bold text-foreground"
            >
              {walkPhases[transitionPhase].title}
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar: close + phase dots + settings */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <button onClick={handleCancel} className="rounded-full p-2 text-muted-foreground/60 hover:text-muted-foreground">
          <X className="h-5 w-5" />
        </button>

        <div className="w-9" />

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-full p-2 text-muted-foreground/60 hover:text-muted-foreground"
        >
          <Settings2 className="h-5 w-5" />
        </button>
      </div>

      {/* Main immersive area */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        {/* Phase icon — large, glowing, breathing */}
        <motion.div
          key={currentPhase}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 18, duration: 0.8 }}
          className={`flex h-40 w-40 items-center justify-center rounded-full ${phase.color} ${isWalking ? "animate-breathe" : ""}`}
          style={{
            background: `hsl(${phaseHsl} / 0.1)`,
            boxShadow: `0 0 40px -4px hsl(${phaseHsl} / 0.3), 0 0 80px -8px hsl(${phaseHsl} / 0.15)`,
          }}
        >
          <Icon className="h-16 w-16" />
        </motion.div>

        {/* Phase name + prompt */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="mt-8 text-center"
          >
            <h2 className="font-display text-2xl font-bold text-foreground">
              {phase.title}
            </h2>
            {promptText && guidanceMode !== "minimal" && (
              <p className="mt-4 max-w-xs mx-auto text-sm italic leading-relaxed text-foreground/60">
                "{promptText}"
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Timer */}
        <p
          className="mt-8 font-display text-6xl font-bold tabular-nums tracking-tight text-foreground/90"
          style={{ textShadow: "0 2px 16px hsl(25 25% 12% / 0.04)" }}
        >
          {formatTime(elapsed)}
        </p>

        {/* Coach speaking indicator */}
        <AnimatePresence>
          {coachSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-primary/50"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground/60">Speaking</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls — pinned to bottom */}
      <div className="relative z-10 pt-4" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 1.5rem) + 1rem)" }}>
        <div className="flex items-center justify-center gap-5">
          {!isWalking && elapsed === 0 ? (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={handleStart}
                className="gradient-sunrise gap-2 rounded-full px-12 py-7 text-lg text-primary-foreground shadow-glow"
              >
                <Play className="h-5 w-5" />
                Begin Walk
              </Button>
            </motion.div>
          ) : (
            <>
              <Button
                size="lg"
                variant="outline"
                onClick={isWalking ? handlePause : handleStart}
                className="h-14 w-14 rounded-full p-0 border-muted-foreground/20"
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
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    onClick={() => void handleFinish()}
                    className="gradient-sunrise gap-2 rounded-full px-6 py-6 text-primary-foreground shadow-glow"
                  >
                    <Check className="h-4 w-4" />
                    Finish Walk
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Spotify embed (keep functional but minimal) */}
        {currentMedia?.type === "spotify" && currentMedia.spotifyTrackId && !useSDK && (
          <div className="mx-auto mt-4 max-w-sm px-8 rounded-xl overflow-hidden opacity-80">
            <SpotifyEmbed trackId={currentMedia.spotifyTrackId} compact autoPlay={isWalking} />
          </div>
        )}
      </div>

      {/* Settings drawer overlay */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 z-50 bg-foreground/20"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card p-6 shadow-elevated"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/20" />
              <p className="font-display text-lg font-semibold text-foreground">Settings</p>

              {/* Guidance mode */}
              <div className="mt-5">
                <p className="text-xs font-medium text-muted-foreground mb-2">Guidance Level</p>
                <div className="flex gap-2">
                  {(["minimal", "moderate", "rich"] as GuidanceMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setGuidanceModeState(mode);
                        setGuidanceMode(mode);
                      }}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-medium capitalize transition-all ${
                        guidanceMode === mode
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice volume */}
              {guidanceMode !== "minimal" && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Coach Voice Volume</p>
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={coachVolume}
                      onChange={(e) => {
                        const vol = parseFloat(e.target.value);
                        setCoachVolumeState(vol);
                        setCoachVolume(vol);
                      }}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary
                        [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
                    />
                    <span className="w-8 text-right text-xs text-muted-foreground">
                      {Math.round(coachVolume * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Now playing */}
              {currentMedia && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Now Playing</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm text-foreground">{currentMedia.title}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full rounded-full bg-secondary py-3 text-sm font-medium text-foreground"
              >
                Done
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Walk;
