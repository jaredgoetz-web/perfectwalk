import { useState } from "react";
import { Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseSpotifyUrl, saveUserSong, Song } from "@/lib/songLibrary";
import SpotifyEmbed from "@/components/SpotifyEmbed";

interface AddSpotifySongProps {
  phaseId: number;
  onAdded: () => void;
}

const AddSpotifySong = ({ phaseId, onAdded }: AddSpotifySongProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setError("");
    const id = parseSpotifyUrl(val);
    setTrackId(id);
    if (val.trim() && !id) {
      setError("Paste a valid Spotify track link");
    }
  };

  const handleAdd = () => {
    if (!trackId) return;
    const song: Song = {
      id: `spotify-${trackId}-${Date.now()}`,
      title: title.trim() || "Spotify Track",
      phaseId,
      audioSrc: "",
      spotifyTrackId: trackId,
    };
    saveUserSong(song);
    setUrl("");
    setTitle("");
    setTrackId(null);
    setOpen(false);
    onAdded();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary hover:underline"
      >
        <Link2 className="h-3.5 w-3.5" />
        Add from Spotify
      </button>
    );
  }

  return (
    <div className="mx-3 mb-3 space-y-3 rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Add Spotify Track
      </p>

      <input
        type="text"
        placeholder="Song name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      <input
        type="text"
        placeholder="Paste Spotify track URL…"
        value={url}
        onChange={(e) => handleUrlChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      {trackId && (
        <SpotifyEmbed trackId={trackId} />
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => { setOpen(false); setUrl(""); setTitle(""); setTrackId(null); }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1"
          disabled={!trackId}
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Song
        </Button>
      </div>
    </div>
  );
};

export default AddSpotifySong;
