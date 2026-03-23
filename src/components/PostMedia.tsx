import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export type MediaType = "image" | "video" | "gif" | "empty";

export function getMediaType(midia?: string): MediaType {
  if (!midia || midia === "EMPTY") return "empty";
  if (midia.startsWith("gif:"))         return "gif";
  if (midia.startsWith("data:video/"))  return "video";
  const ext = midia.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "ogg", "mov", "quicktime"].includes(ext)) return "video";
  return "image";
}

export function getMediaSrc(midia: string): string {
  return midia.startsWith("gif:") ? midia.slice(4) : midia;
}

interface PostMediaProps {
  midia:      string;
  maxHeight?: number;
  onClick?:   () => void;
  inModal?:   boolean;
}

const PostMedia = ({ midia, maxHeight = 480, onClick, inModal = false }: PostMediaProps) => {
  const type = getMediaType(midia);
  const src  = getMediaSrc(midia);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [muted,   setMuted]   = useState(true);
  const [playing, setPlaying] = useState(false);

  // Autoplay ao entrar na viewport
  useEffect(() => {
    if (type !== "video" || inModal) return;
    const el   = videoRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.play().catch(() => {}); setPlaying(true);  }
        else                      { el.pause();                  setPlaying(false); }
      },
      { threshold: 0.5 }
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [type, inModal]);

  // No modal: autoplay com som
  useEffect(() => {
    if (type !== "video" || !inModal) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    setMuted(false);
    el.play().catch(() => {});
  }, [type, inModal]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  if (type === "empty") return null;

  // Container: inline-block para abraçar a mídia sem deixar fundo nas laterais
  return (
    <div
      ref={wrapRef}
      className="overflow-hidden relative w-full"
      onClick={!inModal ? onClick : undefined}
    >
      {/* ── Imagem ── */}
      {type === "image" && (
        <img
          src={src}
          alt="Post"
          loading="lazy"
          className="block w-full h-auto cursor-pointer"
          style={{ maxHeight, objectFit: "contain", background: "hsl(var(--secondary)/0.15)" }}
        />
      )}

      {/* ── GIF ── */}
      {type === "gif" && (
        <img
          src={src}
          alt="GIF"
          className="block w-full h-auto cursor-pointer"
          style={{ maxHeight, objectFit: "contain", background: "hsl(var(--secondary)/0.15)" }}
        />
      )}

      {/* ── Vídeo ── */}
      {type === "video" && (
        <>
          <video
            ref={videoRef}
            src={src}
            loop
            muted={muted}
            playsInline
            preload="metadata"
            controls={inModal}
            className="block w-full h-auto"
            style={{ maxHeight, objectFit: "contain", background: "#000" }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          {!inModal && (
            <button
              onClick={toggleMute}
              className="absolute bottom-2 right-2 p-1.5 rounded-full transition-all z-10"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
              {muted
                ? <VolumeX size={14} className="text-white" />
                : <Volume2 size={14} className="text-white" />
              }
            </button>
          )}

          {!inModal && !playing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostMedia;