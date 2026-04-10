/**
 * Shared Framer Motion presets for consistent, premium animations.
 * Use these across all pages for a Calm/Headspace-level feel.
 */

export const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
};

export const fadeInUpSlow = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.12 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, type: "spring" as const, stiffness: 200, damping: 20 },
};

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35 },
};

export const springTransition = {
  type: "spring" as const,
  stiffness: 180,
  damping: 22,
  mass: 1,
};

// Phase color map for dynamic styling
export const phaseColorMap: Record<number, string> = {
  1: "350 40% 65%",  // dawn-rose
  2: "38 90% 55%",   // warm-glow
  3: "140 20% 45%",  // sage-green
  4: "260 25% 70%",  // sky-lavender
  5: "32 80% 50%",   // primary
};
