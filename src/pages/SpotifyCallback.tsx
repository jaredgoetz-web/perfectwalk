import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleCallback } from "@/lib/spotifyAuth";
import { Loader2 } from "lucide-react";

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const err = params.get("error");

    if (err) {
      setError("Spotify authorization was denied.");
      return;
    }

    if (!code) {
      setError("No authorization code received.");
      return;
    }

    handleCallback(code)
      .then((returnPath) => navigate(returnPath, { replace: true }))
      .catch(() => setError("Failed to connect to Spotify. Please try again."));
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Connecting to Spotify…</p>
      </div>
    </div>
  );
};

export default SpotifyCallback;
