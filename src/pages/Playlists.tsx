import { motion } from "framer-motion";
import { ExternalLink, Music } from "lucide-react";
import { walkPhases } from "@/components/WalkPhaseCard";

const playlists = [
  {
    name: "The Perfect Walk — Full Journey",
    description: "A curated 25-minute playlist covering all 5 phases",
    link: "#",
  },
  {
    name: "Heart Openers",
    description: "Gentle, love-filled tracks to open your heart",
    link: "#",
  },
  {
    name: "Power & Energy",
    description: "Epic, empowering instrumentals to awaken your giant",
    link: "#",
  },
  {
    name: "Presence & Stillness",
    description: "Ambient sounds for total presence and letting go",
    link: "#",
  },
  {
    name: "Celebration Mix",
    description: "Uplifting, high-energy tracks to close your walk",
    link: "#",
  },
];

const Playlists = () => {
  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto max-w-lg px-5 pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Playlists</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Music curated for each phase of The Perfect Walk
          </p>
        </motion.div>

        {/* Playlist cards */}
        <div className="mt-6 space-y-3">
          {playlists.map((pl, i) => (
            <motion.a
              key={pl.name}
              href={pl.link}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-warm transition-all hover:shadow-elevated"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg gradient-sunrise">
                <Music className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-foreground">{pl.name}</p>
                <p className="text-sm text-muted-foreground">{pl.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </motion.a>
          ))}
        </div>

        {/* Songs by phase */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground">Songs by Phase</h2>
          <div className="mt-4 space-y-5">
            {walkPhases.map((phase) => {
              const Icon = phase.icon;
              return (
                <div key={phase.id}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${phase.color}`} />
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {phase.title}
                    </h3>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {phase.songs.map((song) => (
                      <span
                        key={song}
                        className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                      >
                        {song}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playlists;
