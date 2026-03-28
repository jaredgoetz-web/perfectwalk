import { Play, Pause, Check, Plus } from "lucide-react";
import { Song } from "@/lib/songLibrary";
import { motion } from "framer-motion";

interface SongRowProps {
  song: Song;
  index: number;
  isPlaying?: boolean;
  isSelected?: boolean;
  onPlay?: () => void;
  onSelect?: () => void;
  showSelect?: boolean;
}

const SongRow = ({ song, index, isPlaying, isSelected, onPlay, onSelect, showSelect }: SongRowProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
        isPlaying ? "bg-primary/10" : "hover:bg-secondary"
      }`}
    >
      {/* Play button */}
      <button
        onClick={onPlay}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
          isPlaying
            ? "gradient-sunrise text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`font-display text-base font-semibold truncate ${isPlaying ? "text-primary" : "text-foreground"}`}>
          {song.title}
        </p>
        {song.duration && (
          <p className="text-xs text-muted-foreground">{song.duration}</p>
        )}
      </div>

      {/* Select / check for playlist builder */}
      {showSelect && (
        <button
          onClick={onSelect}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-3 w-3" />}
        </button>
      )}
    </motion.div>
  );
};

export default SongRow;
