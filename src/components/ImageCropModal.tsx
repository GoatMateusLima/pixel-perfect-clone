import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react";

interface Props {
  src: string;
  shape: "circle" | "rect";
  outputWidth: number;
  outputHeight: number;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

const ImageCropModal = ({ src, shape, outputWidth, outputHeight, onConfirm, onCancel }: Props) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // image natural size
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // crop state
  const [zoom,   setZoom]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // offset of image center from crop center

  // drag
  const dragging   = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });

  // ── preview area size (px) ──────────────────────────────────────────────────
  const PREVIEW = shape === "circle" ? 280 : Math.min(560, Math.round(280 * (outputWidth / outputHeight)));
  const PREVIEW_H = shape === "circle" ? 280 : Math.round(PREVIEW * (outputHeight / outputWidth));

  // ── load image ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
      // fit image to fill crop area initially
      const scale = Math.max(PREVIEW / img.naturalWidth, PREVIEW_H / img.naturalHeight);
      setZoom(scale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  // ── draw preview ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d")!;
    canvas.width  = PREVIEW;
    canvas.height = PREVIEW_H;

    ctx.clearRect(0, 0, PREVIEW, PREVIEW_H);

    const img = imgRef.current;
    const drawW = img.naturalWidth  * zoom;
    const drawH = img.naturalHeight * zoom;
    // top-left corner of image so its center + offset lands at crop center
    const x = PREVIEW  / 2 - drawW / 2 + offset.x;
    const y = PREVIEW_H / 2 - drawH / 2 + offset.y;

    ctx.save();
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(PREVIEW / 2, PREVIEW_H / 2, PREVIEW / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();
  }, [imgLoaded, zoom, offset, shape]);

  // ── clamp offset so image always covers crop ────────────────────────────────
  const clampOffset = useCallback((ox: number, oy: number, z: number) => {
    if (!imgRef.current) return { x: ox, y: oy };
    const drawW = imgRef.current.naturalWidth  * z;
    const drawH = imgRef.current.naturalHeight * z;
    const maxX  = Math.max(0, (drawW - PREVIEW)  / 2);
    const maxY  = Math.max(0, (drawH - PREVIEW_H) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) };
  }, [PREVIEW, PREVIEW_H]);

  // ── mouse drag ──────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastPos.current  = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, zoom));
  }, [zoom, clampOffset]);
  const onMouseUp   = () => { dragging.current = false; };

  // ── touch drag ──────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, zoom));
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [onMouseMove]);

  // ── wheel zoom ──────────────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.93;
    const newZ   = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    setZoom(newZ);
    setOffset(prev => clampOffset(prev.x, prev.y, newZ));
  };

  // ── zoom buttons ─────────────────────────────────────────────────────────────
  const changeZoom = (factor: number) => {
    const newZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    setZoom(newZ);
    setOffset(prev => clampOffset(prev.x, prev.y, newZ));
  };

  // ── reset ───────────────────────────────────────────────────────────────────
  const reset = () => {
    if (!imgRef.current) return;
    const scale = Math.max(PREVIEW / imgRef.current.naturalWidth, PREVIEW_H / imgRef.current.naturalHeight);
    setZoom(scale);
    setOffset({ x: 0, y: 0 });
  };

  // ── confirm — render to output size ─────────────────────────────────────────
  const confirm = () => {
    if (!imgRef.current) return;
    const out = document.createElement("canvas");
    out.width  = outputWidth;
    out.height = outputHeight;
    const ctx  = out.getContext("2d")!;

    const scaleX = outputWidth  / PREVIEW;
    const scaleY = outputHeight / PREVIEW_H;
    const drawW  = imgRef.current.naturalWidth  * zoom * scaleX;
    const drawH  = imgRef.current.naturalHeight * zoom * scaleY;
    const x      = outputWidth  / 2 - drawW / 2 + offset.x * scaleX;
    const y      = outputHeight / 2 - drawH / 2 + offset.y * scaleY;

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(imgRef.current, x, y, drawW, drawH);
    onConfirm(out.toDataURL("image/png"));
  };

  const zoomPct = imgRef.current
    ? Math.round((zoom / Math.max(PREVIEW / imgRef.current.naturalWidth, PREVIEW_H / imgRef.current.naturalHeight)) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.93, y: 16 }}
        animate={{ scale: 1,    y: 0  }}
        exit={{ scale: 0.93,    y: 16 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-5 rounded-sm p-6"
        style={{
          background: "hsl(215 30% 10%)",
          border: "1px solid hsl(155 60% 45% / 0.3)",
          boxShadow: "0 0 60px hsl(155 60% 45% / 0.12)",
          maxWidth: "90vw",
        }}
      >
        {/* Title */}
        <div className="w-full flex items-center justify-between">
          <p className="font-display text-sm font-bold text-foreground">
            {shape === "circle" ? "Ajustar foto de perfil" : "Ajustar banner"}
          </p>
          <p className="text-[10px] font-accent text-muted-foreground">
            Arraste para reposicionar · scroll para zoom
          </p>
        </div>

        {/* Canvas crop area */}
        <div
          ref={containerRef}
          className="relative flex-shrink-0 overflow-hidden select-none"
          style={{
            width:  PREVIEW,
            height: PREVIEW_H,
            borderRadius: shape === "circle" ? "50%" : "4px",
            border: "2px solid hsl(155 60% 45% / 0.5)",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            cursor: "grab",
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onWheel={onWheel}
        >
          {imgLoaded
            ? <canvas ref={canvasRef} style={{ width: PREVIEW, height: PREVIEW_H, display: "block", pointerEvents: "none" }} />
            : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-accent">Carregando...</div>
          }
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeZoom(0.85)}
            className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            style={{ border: "1px solid hsl(var(--border))", background: "hsl(215 25% 14%)" }}>
            <ZoomOut size={14} />
          </button>

          {/* Zoom slider */}
          <input
            type="range"
            min={MIN_ZOOM * 100}
            max={MAX_ZOOM * 100}
            step={1}
            value={Math.round(zoom * 100)}
            onChange={(e) => {
              const newZ = Number(e.target.value) / 100;
              setZoom(newZ);
              setOffset(prev => clampOffset(prev.x, prev.y, newZ));
            }}
            className="w-32 accent-primary h-1 cursor-pointer"
          />

          <button
            onClick={() => changeZoom(1.15)}
            className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            style={{ border: "1px solid hsl(var(--border))", background: "hsl(215 25% 14%)" }}>
            <ZoomIn size={14} />
          </button>

          <span className="text-[11px] font-accent text-muted-foreground w-10 text-right">{zoomPct}%</span>

          <button
            onClick={reset}
            title="Resetar"
            className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            style={{ border: "1px solid hsl(var(--border))", background: "hsl(215 25% 14%)" }}>
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm text-xs font-accent font-semibold text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30 transition">
            <X size={13} /> Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={!imgLoaded}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm text-xs font-accent font-semibold text-primary-foreground disabled:opacity-50 transition"
            style={{ background: "hsl(155 60% 40%)" }}>
            <Check size={13} /> Confirmar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageCropModal;