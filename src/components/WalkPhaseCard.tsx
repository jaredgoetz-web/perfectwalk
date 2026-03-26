import { motion } from "framer-motion";
import { Heart, Zap, Sparkles, Leaf, PartyPopper, LucideIcon } from "lucide-react";

export interface WalkPhase {
  id: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  songs: string[];
}

export const walkPhases: WalkPhase[] = [
  {
    id: 1,
    title: "Opening Your Heart",
    subtitle: "Fall in love with life",
    icon: Heart,
    color: "text-dawn-rose",
    songs: ["Gentle Breeze", "When Hearts Touch", "Beautiful Spirit"],
  },
  {
    id: 2,
    title: "Feeling Your Power",
    subtitle: "Awaken the giant within",
    icon: Zap,
    color: "text-warm-glow",
    songs: ["Follow Your Dream", "Time", "Larger than Life", "The Blue Planet", "Oriana"],
  },
  {
    id: 3,
    title: "Letting Go",
    subtitle: "Total presence in the moment",
    icon: Leaf,
    color: "text-sage-green",
    songs: ["Night", "Kindred Spirit"],
  },
  {
    id: 4,
    title: "Connecting with Source",
    subtitle: "Realize what you truly are",
    icon: Sparkles,
    color: "text-sky-lavender",
    songs: ["Forgiving", "Kothbiro", "Purnamada"],
  },
  {
    id: 5,
    title: "Celebration",
    subtitle: "Raise your vibration",
    icon: PartyPopper,
    color: "text-primary",
    songs: ["Holograms", "Africa"],
  },
];

interface WalkPhaseCardProps {
  phase: WalkPhase;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
}

const WalkPhaseCard = ({ phase, index, isActive, onClick }: WalkPhaseCardProps) => {
  const Icon = phase.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all ${
        isActive
          ? "bg-primary/10 ring-2 ring-primary/30"
          : "bg-card hover:bg-secondary"
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary ${phase.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold text-foreground">{phase.title}</p>
        <p className="text-sm text-muted-foreground">{phase.subtitle}</p>
      </div>
      <span className="shrink-0 font-display text-2xl font-bold text-muted-foreground/40">
        {phase.id}
      </span>
    </motion.button>
  );
};

export default WalkPhaseCard;
