import { motion } from "framer-motion";
import { Heart, Zap, Sparkles, Leaf, PartyPopper, LucideIcon } from "lucide-react";
import { phaseColorMap } from "@/lib/motionPresets";

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
  const hsl = phaseColorMap[phase.id] || "32 80% 50%";

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-all duration-300 ${
        isActive
          ? "border border-primary/20"
          : "bg-card card-hover"
      }`}
      style={
        isActive
          ? {
              background: `hsl(${hsl} / 0.08)`,
              boxShadow: `0 0 24px -4px hsl(${hsl} / 0.2), 0 0 48px -8px hsl(${hsl} / 0.1)`,
            }
          : undefined
      }
    >
      <motion.div
        animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={isActive ? { duration: 7, repeat: Infinity, ease: "easeInOut" } : {}}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${phase.color}`}
        style={{ background: `hsl(${hsl} / ${isActive ? 0.15 : 0.08})` }}
      >
        <Icon className="h-5 w-5" />
      </motion.div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold text-foreground">{phase.title}</p>
        <p className="text-sm text-muted-foreground">{phase.subtitle}</p>
      </div>
      <span className={`shrink-0 font-display text-2xl font-bold ${isActive ? "text-primary/40" : "text-muted-foreground/30"}`}>
        {phase.id}
      </span>
    </motion.button>
  );
};

export default WalkPhaseCard;
