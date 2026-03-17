/**
 * PostMedia.tsx
 *
 * Componente de mídia reutilizável — renderiza imagem, vídeo ou GIF.
 *
 * Vídeo: autoplay mudo ao entrar na viewport (IntersectionObserver),
 *        pausa ao sair. Controles de volume visíveis.
 *
 * Coluna `midia` no banco:
 *   "EMPTY"           → sem mídia
 *   "gif:https://..."  → GIF do Tenor (prefixo especial)
 *   "https://..."      → URL do bucket (imagem ou vídeo)
 */

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export type MediaType = "image" | "video" | "gif" | "empty";

export function getMediaType(midia?: string): MediaType {
  if (!midia || midia === "EMPTY") return "empty";
  if (midia.startsWith("gif:"))    return "gif";
  if (midia.startsWith("data:video/")) return "video";
  const ext = midia.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "ogg", "mov", "quicktime"].includes(ext)) return "video";
  return "image";
}

export function getMediaSrc(midia: string): string {
  // Remove o prefixo "gif:" para obter a URL real
  return midia.startsWith("gif:") ? midia.slice(4) : midia;
}

// ─── PostMedia ────────────────────────────────────────────────────────────────

interface PostMediaProps {
  midia:       string;
  maxHeight?:  number;
  onClick?:    () => void;  // abre modal ao clicar
  inModal?:    boolean;     // no modal: autoplay com som, sem clique para abrir
}

const PostMedia = ({ midia, maxHeight = 340, onClick, inModal = false }: PostMediaProps) => {
  const type = getMediaType(midia);
  const src  = getMediaSrc(midia);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [muted,   setMuted]   = useState(true);
  const [playing, setPlaying] = useState(false);

  // ── Autoplay ao entrar na viewport (estilo Twitter) ──────────────────────
  useEffect(() => {
    if (type !== "video" || inModal) return;
    const el  = videoRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {}); // silencia erro se bloqueado pelo browser
          setPlaying(true);
        } else {
          el.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.5 } // 50% visível para autoplay
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

  return (
    <div
      ref={wrapRef}
      className="rounded-sm overflow-hidden border border-border/40 bg-black/20 relative"
      style={{ maxHeight }}
      onClick={!inModal ? onClick : undefined}>

      {/* ── Imagem ── */}
      {type === "image" && (
        <img
          src={src}
          alt="Post"
          loading="lazy"
          className="w-full object-cover cursor-pointer"
          style={{ maxHeight }}
        />
      )}

      {/* ── GIF ── */}
      {type === "gif" && (
        <img
          src={src}
          alt="GIF"
          className="w-full object-contain cursor-pointer"
          style={{ maxHeight }}
        />
      )}

      {/* ── Vídeo ── */}
      {type === "video" && (
        <>
          <video
            ref={videoRef}
            src={src}
            loop
            muted
            playsInline
            preload="metadata"
            controls={inModal}            // controles nativos só no modal
            className="w-full object-contain"
            style={{ maxHeight }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          {/* Controle de volume — aparece no card (não no modal que tem controles nativos) */}
          {!inModal && (
            <button
              onClick={toggleMute}
              className="absolute bottom-2 right-2 p-1.5 rounded-full transition-all"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
              {muted
                ? <VolumeX size={14} className="text-white" />
                : <Volume2 size={14} className="text-white" />
              }
            </button>
          )}

          {/* Indicador de play/pause ao clicar no card */}
          {!inModal && !playing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
