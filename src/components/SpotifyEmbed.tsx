import { useEffect, useRef } from "react";
import type { SpotifyIframeApi, SpotifyIframeController } from "@/lib/webSpeech";

interface SpotifyEmbedProps {
  trackId: string;
  compact?: boolean;
  autoPlay?: boolean;
}

const SpotifyEmbed = ({ trackId, compact = true, autoPlay = false }: SpotifyEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyIframeController | null>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    controllerRef.current = null;

    const initEmbed = (iframeApi: SpotifyIframeApi) => {
      const element = document.createElement("div");
      container.appendChild(element);

      iframeApi.createController(
        element,
        {
          uri: `spotify:track:${trackId}`,
          width: "100%",
          height: compact ? 80 : 152,
        },
        (controller) => {
          controllerRef.current = controller;
          if (autoPlay) {
            controller.addListener("ready", () => {
              controller.play();
            });
          }
        },
      );
    };

    if (window.SpotifyIframeApi) {
      initEmbed(window.SpotifyIframeApi);
    } else if (!scriptLoaded.current) {
      scriptLoaded.current = true;
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyIframeApiReady = (iframeApi) => {
        window.SpotifyIframeApi = iframeApi;
        initEmbed(iframeApi);
      };
    } else {
      const interval = setInterval(() => {
        if (window.SpotifyIframeApi) {
          clearInterval(interval);
          initEmbed(window.SpotifyIframeApi);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [trackId, compact, autoPlay]);

  return <div ref={containerRef} className="overflow-hidden rounded-xl [&_iframe]:rounded-xl" />;
};

export default SpotifyEmbed;
