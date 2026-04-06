import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

interface Props {
  src: string;
  shape: "circle" | "rect";
  outputWidth: number;
  outputHeight: number;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const MIN_SCALE = 1;   // multiplicador relativo ao baseScale (cover)
const MAX_SCALE = 4;

const ImageCropModal = ({ src, shape, outputWidth, outputHeight, onConfirm, onCancel }: Props) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);

  // baseScale = escala que faz a imagem preencher exatamente o preview (cover)
  const baseScaleRef = useRef(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale,  setScale]  = useState(1);      // relativo ao baseScale
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });

  // Tamanho visual (CSS px) do canvas de preview
  const PREVIEW   = shape === "circle" ? 280 : Math.min(520, Math.round(280 * (outputWidth / outputHeight)));
  const PREVIEW_H = shape === "circle" ? 280 : Math.round(PREVIEW * (outputHeight / outputWidth));

  // ── Carrega imagem e calcula baseScale (cover) ────────────────────────
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const bs = Math.max(PREVIEW / img.naturalWidth, PREVIEW_H / img.naturalHeight);
      baseScaleRef.current = bs;
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = src;
  }, [src, PREVIEW, PREVIEW_H]);

  // ── Renderiza o preview — DPR-aware para nitidez perfeita ─────────────
  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d")!;
    const dpr    = window.devicePixelRatio || 1;

    canvas.width  = PREVIEW  * dpr;
    canvas.height = PREVIEW_H * dpr;
    canvas.style.width  = `${PREVIEW}px`;
    canvas.style.height = `${PREVIEW_H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, PREVIEW, PREVIEW_H);

    const img   = imgRef.current;
    const effZ  = baseScaleRef.current * scale;
    const drawW = img.naturalWidth  * effZ;
    const drawH = img.naturalHeight * effZ;
    const x     = PREVIEW  / 2 - drawW / 2 + offset.x;
    const y     = PREVIEW_H / 2 - drawH / 2 + offset.y;

    ctx.save();
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(PREVIEW / 2, PREVIEW_H / 2, PREVIEW / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();
  }, [imgLoaded, scale, offset, shape, PREVIEW, PREVIEW_H]);

  // ── Clamp offset para imagem nunca sair do frame ──────────────────────
  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    if (!imgRef.current) return { x: ox, y: oy };
    const effZ  = baseScaleRef.current * s;
    const drawW = imgRef.current.naturalWidth  * effZ;
    const drawH = imgRef.current.naturalHeight * effZ;
    const maxX  = Math.max(0, (drawW - PREVIEW)  / 2);
    const maxY  = Math.max(0, (drawH - PREVIEW_H) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, [PREVIEW, PREVIEW_H]);

  // ── Mouse drag ────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale));
  }, [scale, clampOffset]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── Touch ─────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale));
  };

  // ── Scroll para zoom com suavidade ────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor   = e.deltaY < 0 ? 1.08 : 0.93;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor));
    setScale(newScale);
    setOffset(prev => clampOffset(prev.x, prev.y, newScale));
  };

  const changeScale = (factor: number) => {
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor));
    setScale(newScale);
    setOffset(prev => clampOffset(prev.x, prev.y, newScale));
  };

  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  // ── Confirmar — mesma fórmula do preview escalada para o output ───────
  const confirm = () => {
    if (!imgRef.current) return;

    const out    = document.createElement("canvas");
    out.width    = outputWidth;
    out.height   = outputHeight;
    const ctx    = out.getContext("2d")!;

    // Proporção preview → output
    const scaleX = outputWidth  / PREVIEW;
    const scaleY = outputHeight / PREVIEW_H;

    // zoom efetivo no espaço do output (usa a MESMA base do preview)
    const effZ  = baseScaleRef.current * scale;
    const drawW = imgRef.current.naturalWidth  * effZ * scaleX;
    const drawH = imgRef.current.naturalHeight * effZ * scaleY;
    const x     = outputWidth  / 2 - drawW / 2 + offset.x * scaleX;
    const y     = outputHeight / 2 - drawH / 2 + offset.y * scaleY;

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(imgRef.current, x, y, drawW, drawH);
    onConfirm(out.toDataURL("image/png"));
  };

  const zoomPct = Math.round(scale * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.93, y: 24, opacity: 0 }}
        animate={{ scale: 1,    y: 0,  opacity: 1 }}
        exit={{    scale: 0.93, y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-5 p-7 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, hsl(230 35% 8%) 0%, hsl(270 40% 6%) 100%)",
          border: "1px solid hsl(270 60% 55% / 0.25)",
          boxShadow: "0 0 80px hsl(270 60% 55% / 0.1), 0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          maxWidth: "92vw",
        }}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <p className="text-white/90 text-sm font-semibold tracking-wide">
              {shape === "circle" ? "✦ Ajustar foto de perfil" : "✦ Ajustar banner"}
            </p>
            <p className="text-white/25 text-[10px] mt-0.5">
              Arraste para reposicionar · Scroll para zoom
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(270 60% 55% / 0.3), transparent)" }} />

        {/* Canvas de preview */}
        <div
          ref={containerRef}
          className="relative flex-shrink-0 overflow-hidden select-none"
          style={{
            width:        PREVIEW,
            height:       PREVIEW_H,
            borderRadius: shape === "circle" ? "50%" : "12px",
            border:       "2px solid hsl(270 60% 60% / 0.5)",
            boxShadow:    "0 0 0 9999px rgba(0,0,0,0.6), 0 0 40px hsl(270 60% 55% / 0.2)",
            cursor:       isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onWheel={onWheel}
        >
          {imgLoaded
            ? <canvas
                ref={canvasRef}
                style={{ display: "block", pointerEvents: "none" }}
              />
            : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                Carregando…
              </div>
          }
        </div>

        {/* Controles de zoom */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            onClick={() => changeScale(0.85)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 border border-white/10 hover:border-white/25 transition-all"
          >
            <ZoomOut size={13} />
          </button>

          <div className="relative flex-1 max-w-[160px] h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all"
              style={{
                width: `${((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%`,
                background: "linear-gradient(90deg, hsl(270 60% 55%), hsl(155 60% 50%))",
              }}
            />
            <input
              type="range"
              min={MIN_SCALE * 100}
              max={MAX_SCALE * 100}
              step={1}
              value={Math.round(scale * 100)}
              onChange={(e) => {
                const newScale = Number(e.target.value) / 100;
                setScale(newScale);
                setOffset(prev => clampOffset(prev.x, prev.y, newScale));
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          <button
            onClick={() => changeScale(1.15)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 border border-white/10 hover:border-white/25 transition-all"
          >
            <ZoomIn size={13} />
          </button>

          <span className="text-white/25 text-[11px] w-10 text-right font-mono">{zoomPct}%</span>

          <button
            onClick={reset}
            title="Resetar"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 border border-white/10 hover:border-white/25 transition-all"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Ações */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
          >
            <X size={12} /> Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={!imgLoaded}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, hsl(270 60% 45%), hsl(270 60% 35%))",
              border: "1px solid hsl(270 60% 55% / 0.5)",
              color: "white",
              boxShadow: imgLoaded ? "0 0 20px hsl(270 60% 55% / 0.25)" : "none",
            }}
          >
            <Check size={12} /> Confirmar recorte
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageCropModal;