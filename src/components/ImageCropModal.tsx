import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Move } from "lucide-react";

interface ImageCropModalProps {
  src: string;
  shape: "circle" | "rect";
  /** Output canvas size */
  outputWidth: number;
  outputHeight: number;
  title?: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

// Display crop frame dimensions (what the user sees on screen)
const DISPLAY: Record<"circle" | "rect", { w: number; h: number }> = {
  circle: { w: 240, h: 240 },
  rect:   { w: 520, h: 130 },
};

export const ImageCropModal = ({
  src, shape, outputWidth, outputHeight, title, onConfirm, onCancel,
}: ImageCropModalProps) => {
  const imgRef      = useRef<HTMLImageElement>(null);
  const [ready,     setReady]     = useState(false);
  const [offset,    setOffset]    = useState({ x: 0, y: 0 });
  const [rotation,  setRotation]  = useState(0);
  const [userScale, setUserScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);

  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });

  const dW = DISPLAY[shape].w;
  const dH = DISPLAY[shape].h;

  /* ── Init: compute baseScale so image covers the crop area ── */
  const onImgLoad = useCallback(() => {
    const img = imgRef.current!;
    const bs = Math.max(dW / img.naturalWidth, dH / img.naturalHeight);
    setBaseScale(bs);
    setUserScale(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setReady(true);
  }, [dW, dH]);

  /* ── Mouse drag ── */
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current  = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    setOffset(p => ({
      x: p.x + (e.clientX - lastPos.current.x),
      y: p.y + (e.clientY - lastPos.current.y),
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  /* ── Touch drag ── */
  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    lastPos.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    setOffset(p => ({
      x: p.x + (e.touches[0].clientX - lastPos.current.x),
      y: p.y + (e.touches[0].clientY - lastPos.current.y),
    }));
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  /* ── Export ── */
  const handleConfirm = () => {
    const img = imgRef.current!;
    const canvas  = document.createElement("canvas");
    canvas.width  = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d")!;

    // Scale factor: display px → output px
    const sf = outputWidth / dW;
    const total = baseScale * userScale;

    ctx.save();
    // Clip to shape
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.rect(0, 0, outputWidth, outputHeight);
      ctx.clip();
    }

    // Replicate CSS transform: centered at crop center, then offset + rotate
    ctx.translate(outputWidth / 2 + offset.x * sf, outputHeight / 2 + offset.y * sf);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      (-img.naturalWidth  / 2) * total * sf,
      (-img.naturalHeight / 2) * total * sf,
       img.naturalWidth         * total * sf,
       img.naturalHeight        * total * sf,
    );
    ctx.restore();

    onConfirm(canvas.toDataURL("image/jpeg", 0.93));
  };

  const totalScale = baseScale * userScale;
  const displayImgW = ready ? imgRef.current!.naturalWidth  * totalScale : 0;
  const displayImgH = ready ? imgRef.current!.naturalHeight * totalScale : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.94, y: 14 }}
        animate={{ scale: 1,    y: 0  }}
        exit={{    scale: 0.94, y: 14 }}
        className="hologram-panel rounded-sm p-6 flex flex-col items-center gap-5"
        style={{ maxWidth: "620px", width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <h3 className="font-display font-bold text-foreground">
            {title ?? (shape === "circle" ? "Ajustar foto de perfil" : "Ajustar banner")}
          </h3>
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-accent">
            <Move size={11} /> Arraste para reposicionar
          </span>
        </div>

        {/* ── Crop Frame ── */}
        <div
          style={{
            position: "relative",
            width:  dW,
            height: dH,
            borderRadius: shape === "circle" ? "50%" : "6px",
            overflow: "hidden",
            background: "#0a0a0a",
            cursor: dragging.current ? "grabbing" : "grab",
            border: "2px solid rgba(255,255,255,0.18)",
            flexShrink: 0,
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { dragging.current = false; }}
        >
          {/* The actual image — hidden until loaded */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={onImgLoad}
            draggable={false}
            style={{
              position: "absolute",
              userSelect: "none",
              pointerEvents: "none",
              width:  displayImgW || "auto",
              height: displayImgH || "auto",
              top:  "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              opacity: ready ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          />

          {/* Grid overlay — helps to align */}
          {ready && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
                `,
                backgroundSize: `${dW / 3}px ${dH / 3}px`,
              }}
            />
          )}
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-col gap-3 w-full">
          {/* Zoom */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-accent w-12">Zoom</span>
            <button
              onClick={() => setUserScale(s => Math.max(0.2, +(s - 0.1).toFixed(1)))}
              className="p-1.5 rounded-sm border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors"
            ><ZoomOut size={13} /></button>
            <input
              type="range" min={20} max={400} step={1}
              value={Math.round(userScale * 100)}
              onChange={(e) => setUserScale(Number(e.target.value) / 100)}
              className="flex-1"
              style={{ accentColor: "hsl(155 60% 45%)" }}
            />
            <button
              onClick={() => setUserScale(s => Math.min(4, +(s + 0.1).toFixed(1)))}
              className="p-1.5 rounded-sm border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors"
            ><ZoomIn size={13} /></button>
            <span className="text-xs text-muted-foreground font-accent w-10 text-right">
              {Math.round(userScale * 100)}%
            </span>
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-accent w-12">Girar</span>
            <button
              onClick={() => setRotation(r => r - 90)}
              className="p-1.5 rounded-sm border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors"
            ><RotateCcw size={13} /></button>
            <input
              type="range" min={-180} max={180} step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: "hsl(155 60% 45%)" }}
            />
            <button
              onClick={() => setRotation(r => r + 90)}
              className="p-1.5 rounded-sm border border-border hover:border-primary hover:text-primary text-muted-foreground transition-colors"
            ><RotateCw size={13} /></button>
            <span className="text-xs text-muted-foreground font-accent w-10 text-right">
              {rotation}°
            </span>
          </div>
        </div>

        {/* Reset + Actions */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => { setOffset({ x: 0, y: 0 }); setRotation(0); setUserScale(1); }}
            className="text-xs text-muted-foreground font-accent hover:text-foreground transition-colors"
          >
            Resetar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent text-muted-foreground border border-border hover:text-destructive hover:border-destructive transition-colors"
            >
              <X size={12} /> Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!ready}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-accent font-semibold text-primary-foreground transition-colors disabled:opacity-40"
              style={{ background: "hsl(155 60% 40%)" }}
            >
              <Check size={12} /> Aplicar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageCropModal;
