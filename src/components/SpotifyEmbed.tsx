interface SpotifyEmbedProps {
  trackId: string;
  compact?: boolean;
}

const SpotifyEmbed = ({ trackId, compact = true }: SpotifyEmbedProps) => {
  return (
    <iframe
      key={trackId}
      src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=1`}
      width="100%"
      height={compact ? 80 : 152}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-xl"
    />
  );
};

export default SpotifyEmbed;
