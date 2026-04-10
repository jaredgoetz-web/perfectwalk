import walkCycleImg from "@/assets/walk-cycle.png";

interface WalkCycleIconProps {
  size?: number;
  className?: string;
}

/**
 * The Perfect Walk cycle illustration from the book.
 * Shows the walking figure surrounded by 5 phase circles.
 */
const WalkCycleIcon = ({ size = 200, className = "" }: WalkCycleIconProps) => {
  return (
    <img
      src={walkCycleImg}
      alt="The Perfect Walk — 5 phases"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ filter: "contrast(0.9) brightness(1.05)" }}
    />
  );
};

export default WalkCycleIcon;
