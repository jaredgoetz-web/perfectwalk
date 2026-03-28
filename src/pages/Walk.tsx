import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import heartBg from "@/assets/phase-heart-bg.jpg";
import { Play, Pause, SkipForward, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalkPhaseCard, { walkPhases } from "@/components/WalkPhaseCard";
import { saveWalkEntry, WalkEntry } from "@/lib/walkStore";

const Walk = () => {
  const navigate = useNavigate();
  const [isWalking, setIsWalking] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isWalking) {
      interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isWalking]);

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

  const handleFinish = () => {
    setIsWalking(false);
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
    if (elapsed > 0 && !window.confirm("End your walk without saving?")) return;
    navigate("/");
  };

  const phase = walkPhases[currentPhase];
  const Icon = phase.icon;

  return (
    <div className="min-h-screen pb-24">
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

      {/* Suggested songs */}
      <div className="mx-auto mt-10 max-w-lg px-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Suggested songs for this phase
        </p>
        <div className="flex flex-wrap gap-2">
          {phase.songs.map((song) => (
            <span
              key={song}
              className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground"
            >
              🎵 {song}
            </span>
          ))}
        </div>
      </div>

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
