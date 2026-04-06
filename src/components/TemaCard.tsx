import { useState } from "react";
import {
  ArrowRight, GraduationCap, Code2, Shield, Brain, Cloud,
  Cpu, LineChart, Palette, Zap, Lock, Globe, BookOpen, TrendingUp, X, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tema } from "../pages/RoadmapSection";

// ─── Paleta de cores e ícones por tipo ──────────────────────────────────────
const TYPE_META: Record<string, { color: string; glow: string; icon: React.ElementType }> = {
  "Alta demanda":    { color: "hsl(155 60% 45%)",  glow: "rgba(45,185,129,0.15)",   icon: TrendingUp  },
  "Tecnologia":      { color: "hsl(210 70% 60%)",  glow: "rgba(66,153,225,0.15)",   icon: Code2        },
  "Segurança":       { color: "hsl(0 65% 58%)",    glow: "rgba(230,80,80,0.15)",    icon: Shield       },
  "Dados":           { color: "hsl(270 55% 65%)",  glow: "rgba(150,90,220,0.15)",   icon: Brain        },
  "Cloud":           { color: "hsl(45 85% 55%)",   glow: "rgba(240,190,50,0.15)",   icon: Cloud        },
  "Desenvolvimento": { color: "hsl(25 85% 58%)",   glow: "rgba(235,100,40,0.15)",   icon: Cpu          },
  "Negócios":        { color: "hsl(180 55% 50%)",  glow: "rgba(50,200,200,0.15)",   icon: LineChart    },
  "Criatividade":    { color: "hsl(320 55% 60%)",  glow: "rgba(220,80,170,0.15)",   icon: Palette      },
  "Saúde":           { color: "hsl(155 50% 50%)",  glow: "rgba(50,180,130,0.15)",   icon: Zap          },
  "Cibersegurança":  { color: "hsl(0 65% 58%)",    glow: "rgba(230,80,80,0.15)",    icon: Lock         },
  "Sustentabilidade":{ color: "hsl(120 45% 50%)",  glow: "rgba(80,200,80,0.15)",    icon: Globe        },
  "IA":              { color: "hsl(210 70% 60%)",  glow: "rgba(66,153,225,0.15)",   icon: Cpu          },
};

const getTypeMeta = (type: string) =>
  TYPE_META[type] ?? { color: "hsl(155 60% 45%)", glow: "rgba(45,185,129,0.15)", icon: BookOpen };

interface TemaCardProps {
  tema: Tema;
  index: number;
  onClick: () => void;
}

export const TemaCard = ({ tema, index, onClick }: TemaCardProps) => {
  const { color, glow, icon: Icon } = getTypeMeta(tema.type);
  const [showModal, setShowModal] = useState(false);
  const qtd = tema.courses?.length ?? 0;

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.28, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={onClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: "rgba(15, 18, 28, 0.7)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Glow hover de fundo */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 30% 0%, ${glow} 0%, transparent 65%)` }}
        />

        {/* Barra de cor superior */}
        <div className="h-[3px] w-full shrink-0 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

        <div className="p-5 flex flex-col flex-1 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon size={18} style={{ color }} />
            </div>

            <span
              className="text-[9px] font-accent font-black tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
              style={{ background: `${color}12`, color: `${color}`, border: `1px solid ${color}25` }}
            >
              {tema.type}
            </span>
          </div>

          {/* Título */}
          <h2 className="font-display font-bold text-[1.05rem] leading-snug mb-2 text-white group-hover:text-white transition-colors line-clamp-1"
            style={{ textShadow: `0 0 20px ${color}40` }}>
            {tema.name}
          </h2>

          {/* Descrição */}
          <p className="text-white/40 font-body text-[0.75rem] leading-relaxed line-clamp-2 mb-1 flex-1">
            {tema.description}
          </p>

          {/* "Saiba mais" */}
          <button
            onClick={handleOpenModal}
            className="text-[0.7rem] font-accent font-bold hover:underline self-start mb-4 transition-opacity opacity-50 group-hover:opacity-100"
            style={{ color }}
          >
            Saiba mais →
          </button>

          {/* Footer */}
          <div
            className="flex items-center justify-between mt-auto pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-accent text-white/30">
              <GraduationCap size={12} style={{ color }} />
              <span>{qtd} {qtd === 1 ? "curso" : "cursos"}</span>
            </span>

            <div
              className="flex items-center gap-1.5 text-[11px] font-accent font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 px-2.5 py-1 rounded-full"
              style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
            >
              Explorar <ArrowRight size={11} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de detalhes */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl"
              style={{
                background: "rgba(12, 16, 26, 0.95)",
                border: `1px solid ${color}35`,
                boxShadow: `0 0 60px ${glow}, 0 20px 60px rgba(0,0,0,0.6)`,
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

              <div className="p-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-accent font-black tracking-widest uppercase mb-1" style={{ color }}>{tema.type}</p>
                    <h3 className="font-display font-bold text-lg text-white leading-tight">{tema.name}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-5 text-[11px] font-accent text-white/40">
                  <Sparkles size={12} style={{ color }} />
                  {qtd} {qtd === 1 ? "curso disponível" : "cursos disponíveis"} nesta trilha
                </div>

                <div className="max-h-[40vh] overflow-y-auto scrollbar-hide mb-6">
                  <p className="text-white/50 font-body text-sm leading-relaxed whitespace-pre-wrap">{tema.description}</p>
                </div>

                <button
                  onClick={() => { setShowModal(false); onClick(); }}
                  className="w-full py-3 rounded-xl font-accent font-black text-xs text-black transition-all hover:brightness-110 flex items-center justify-center gap-2"
                  style={{ background: color, boxShadow: `0 0 20px ${color}50` }}
                >
                  Explorar trilha <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export const TemaCardSkeleton = () => (
  <div
    className="rounded-2xl overflow-hidden animate-pulse"
    style={{ background: "rgba(15,18,28,0.7)", border: "1px solid rgba(255,255,255,0.05)" }}
  >
    <div className="h-[3px] bg-white/5" />
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5" />
        <div className="h-5 w-20 bg-white/5 rounded-full" />
      </div>
      <div className="h-5 bg-white/8 rounded w-3/4 mb-3" />
      <div className="h-3 bg-white/5 rounded w-full mb-1.5" />
      <div className="h-3 bg-white/5 rounded w-4/5 mb-6" />
      <div className="h-px bg-white/5 mb-3" />
      <div className="h-3 bg-white/5 rounded w-1/4" />
    </div>
  </div>
);