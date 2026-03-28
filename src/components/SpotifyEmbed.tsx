import { useEffect, useRef } from "react";

interface SpotifyEmbedProps {
  trackId: string;
  compact?: boolean;
  autoPlay?: boolean;
}

const SpotifyEmbed = ({ trackId, compact = true, autoPlay = false }: SpotifyEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<any>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous embed
    container.innerHTML = "";
    controllerRef.current = null;

    const initEmbed = (IFrameAPI: any) => {
      const el = document.createElement("div");
      container.appendChild(el);

      IFrameAPI.createController(
        el,
        {
          uri: `spotify:track:${trackId}`,
          width: "100%",
          height: compact ? 80 : 152,
        },
        (controller: any) => {
          controllerRef.current = controller;
          if (autoPlay) {
            controller.addListener("ready", () => {
              controller.play();
            });
          }
        }
      );
    };

    if ((window as any).SpotifyIframeApi) {
      initEmbed((window as any).SpotifyIframeApi);
    } else if (!scriptLoaded.current) {
      scriptLoaded.current = true;
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.body.appendChild(script);

      (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
        (window as any).SpotifyIframeApi = IFrameAPI;
        initEmbed(IFrameAPI);
      };
    } else {
      // Script is loading, wait for it
      const interval = setInterval(() => {
        if ((window as any).SpotifyIframeApi) {
          clearInterval(interval);
          initEmbed((window as any).SpotifyIframeApi);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [trackId, compact, autoPlay]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden [&_iframe]:rounded-xl"
    />
  );
};

export default SpotifyEmbed;
