import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  ListMusic,
  Compass,
  PlusCircle,
  Play,
  Pause,
  Trash2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { walkPhases } from "@/components/WalkPhaseCard";
import {
  songLibrary,
  getSongsByPhase,
  loadPlaylists,
  savePlaylist,
  deletePlaylist,
  loadUserSongs,
  CustomPlaylist,
  Song,
} from "@/lib/songLibrary";
import SongRow from "@/components/SongRow";
import AddSpotifySong from "@/components/AddSpotifySong";
import SpotifyEmbed from "@/components/SpotifyEmbed";

type Tab = "explore" | "playlists" | "create";

const Playlists = () => {
  const [tab, setTab] = useState<Tab>("explore");
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Custom playlists
  const [myPlaylists, setMyPlaylists] = useState<CustomPlaylist[]>(loadPlaylists);

  // Builder state
  const [builderSelections, setBuilderSelections] = useState<Record<number, string>>({});
  const [builderName, setBuilderName] = useState("");

  const togglePlay = useCallback(
    (song: Song) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (playingSongId === song.id) {
        audio.pause();
        setPlayingSongId(null);
      } else {
        audio.src = song.audioSrc;
        audio.play().catch(() => {});
        setPlayingSongId(song.id);
      }
    },
    [playingSongId]
  );

  // Stop audio when switching tabs
  const switchTab = (t: Tab) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingSongId(null);
    }
    setTab(t);
  };

  const toggleBuilderSong = (phaseId: number, songId: string) => {
    setBuilderSelections((prev) => {
      if (prev[phaseId] === songId) {
        const next = { ...prev };
        delete next[phaseId];
        return next;
      }
      return { ...prev, [phaseId]: songId };
    });
  };

  const handleSavePlaylist = () => {
    const songIds = Object.values(builderSelections);
    if (songIds.length === 0) return;
    const pl: CustomPlaylist = {
      id: Date.now().toString(),
      name: builderName.trim() || `My Walk Mix ${myPlaylists.length + 1}`,
      songIds,
      createdAt: new Date().toISOString(),
    };
    savePlaylist(pl);
    setMyPlaylists(loadPlaylists());
    setBuilderSelections({});
    setBuilderName("");
    setTab("playlists");
  };

  const handleDeletePlaylist = (id: string) => {
    deletePlaylist(id);
    setMyPlaylists(loadPlaylists());
  };

  const playPlaylist = (pl: CustomPlaylist) => {
    const firstSong = songLibrary.find((s) => s.id === pl.songIds[0]);
    if (firstSong) togglePlay(firstSong);
  };

  const tabs: { id: Tab; label: string; icon: typeof Music }[] = [
    { id: "explore", label: "Explore", icon: Compass },
    { id: "playlists", label: "My Playlists", icon: ListMusic },
    { id: "create", label: "Create", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen pb-24">
      <audio
        ref={audioRef}
        preload="auto"
        onEnded={() => setPlayingSongId(null)}
      />
      <div className="mx-auto max-w-lg px-5 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground">
            Music
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore songs, build playlists, and soundtrack your walk
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl bg-secondary p-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  tab === t.id
                    ? "bg-card text-foreground shadow-warm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === "explore" && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 space-y-4"
            >
              {walkPhases.map((phase) => {
                const Icon = phase.icon;
                const songs = getSongsByPhase(phase.id);
                const isExpanded = expandedPhase === phase.id;

                return (
                  <div key={phase.id} className="rounded-xl bg-card shadow-warm overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedPhase(isExpanded ? null : phase.id)
                      }
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary ${phase.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold text-foreground">
                          {phase.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {songs.length} song{songs.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="px-2 pb-2">
                            {songs.length > 0 ? (
                              songs.map((song, i) => (
                                <SongRow
                                  key={song.id}
                                  song={song}
                                  index={i}
                                  isPlaying={playingSongId === song.id}
                                  onPlay={() => togglePlay(song)}
                                />
                              ))
                            ) : (
                              <p className="px-3 py-4 text-sm text-muted-foreground italic">
                                No songs yet for this phase
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === "playlists" && (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 space-y-3"
            >
              {/* Curated full journey */}
              <div className="rounded-xl bg-card p-4 shadow-warm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg gradient-sunrise">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold text-foreground">
                      The Perfect Walk
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Full journey · All 5 phases
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full gap-1"
                    onClick={() => {
                      const first = songLibrary[0];
                      if (first) togglePlay(first);
                    }}
                  >
                    <Play className="h-3 w-3" />
                    Play
                  </Button>
                </div>
              </div>

              {/* Custom playlists */}
              {myPlaylists.length > 0 ? (
                myPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-warm"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <ListMusic className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-semibold text-foreground truncate">
                        {pl.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pl.songIds.length} song{pl.songIds.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => playPlaylist(pl)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeletePlaylist(pl.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <ListMusic className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No custom playlists yet
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => switchTab("create")}
                  >
                    Create Your First
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {tab === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6"
            >
              {/* Name input */}
              <input
                type="text"
                placeholder="Playlist name…"
                value={builderName}
                onChange={(e) => setBuilderName(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />

              <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Pick one song per phase
              </p>

              <div className="mt-3 space-y-4">
                {walkPhases.map((phase) => {
                  const Icon = phase.icon;
                  const songs = getSongsByPhase(phase.id);
                  return (
                    <div key={phase.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-4 w-4 ${phase.color}`} />
                        <span className="font-display text-sm font-semibold text-foreground">
                          {phase.title}
                        </span>
                        {builderSelections[phase.id] && (
                          <span className="ml-auto text-xs text-primary font-medium">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      {songs.map((song, i) => (
                        <SongRow
                          key={song.id}
                          song={song}
                          index={i}
                          isPlaying={playingSongId === song.id}
                          isSelected={builderSelections[phase.id] === song.id}
                          onPlay={() => togglePlay(song)}
                          onSelect={() => toggleBuilderSong(phase.id, song.id)}
                          showSelect
                        />
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Save button */}
              <div className="mt-6 pb-4">
                <Button
                  onClick={handleSavePlaylist}
                  disabled={Object.keys(builderSelections).length === 0}
                  className="w-full gradient-sunrise rounded-xl py-6 text-primary-foreground shadow-warm text-base font-semibold"
                >
                  <Music className="h-4 w-4 mr-2" />
                  Save Playlist ({Object.keys(builderSelections).length}/5 phases)
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Playlists;
