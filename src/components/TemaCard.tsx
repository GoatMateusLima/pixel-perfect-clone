import { useState } from "react";
import {
  ArrowRight, GraduationCap, Code2, Shield, Brain, Cloud,
  Cpu, LineChart, Palette, Zap, Lock, Globe, BookOpen, TrendingUp, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tema } from "../pages/RoadmapSection"; 

// ─── Paleta de cores por tipo ─────────────────────────────────────────────────
const TYPE_META: Record<string, { color: string; icon: React.ElementType }> = {
  "Alta demanda":   { color: "hsl(155 60% 45%)", icon: TrendingUp   },
  "Tecnologia":     { color: "hsl(210 70% 60%)", icon: Code2        },
  "Segurança":      { color: "hsl(0 65% 58%)",   icon: Shield        },
  "Dados":          { color: "hsl(270 55% 65%)", icon: Brain         },
  "Cloud":          { color: "hsl(45 85% 55%)",  icon: Cloud         },
  "Desenvolvimento":{ color: "hsl(25 85% 58%)",  icon: Cpu           },
  "Negócios":       { color: "hsl(180 55% 50%)", icon: LineChart     },
  "Criatividade":   { color: "hsl(320 55% 60%)", icon: Palette       },
  "Saúde":          { color: "hsl(155 50% 50%)", icon: Zap           },
  "Cibersegurança": { color: "hsl(0 65% 58%)",   icon: Lock          },
  "Sustentabilidade":{ color: "hsl(120 45% 50%)", icon: Globe        },
  "IA":             { color: "hsl(210 70% 60%)", icon: Cpu           },
};

const getTypeMeta = (type: string) =>
  TYPE_META[type] ?? { color: "hsl(155 60% 45%)", icon: BookOpen };

interface TemaCardProps {
  tema: Tema;
  index: number;
  onClick: () => void;
}

export const TemaCard = ({ tema, index, onClick }: TemaCardProps) => {
  const { color, icon: Icon } = getTypeMeta(tema.type);
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className="group relative hologram-panel rounded-sm cursor-pointer overflow-hidden transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 flex flex-col h-[210px]"
      >
        <div className="h-1 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }} />

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Icon size={14} style={{ color }} />
            </div>
            <span className="text-[9px] font-accent font-bold tracking-widest uppercase"
              style={{ color: `${color}cc` }}>
              {tema.type}
            </span>
          </div>

          <h2 className="font-display font-bold text-[0.95rem] text-foreground mb-1 leading-snug group-hover:text-glow transition-all line-clamp-1">
            {tema.name}
          </h2>

          <div className="flex-1 min-h-0 mb-3">
            <p className="text-muted-foreground font-body text-[0.75rem] leading-relaxed line-clamp-3 mb-1">
              {tema.description}
            </p>
            <button 
              onClick={handleOpenModal}
              className="text-[0.7rem] font-accent font-bold text-primary hover:underline"
            >
              Saiba mais...
            </button>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/10">
            <span className="text-[10px] font-accent text-muted-foreground flex items-center gap-1.5">
              <GraduationCap size={10} style={{ color }} />
              {qtd} curso{qtd !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-accent opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color }}>
              Explorar <ArrowRight size={10} />
            </span>
          </div>
        </div>
      </motion.div>

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
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm hologram-panel rounded-sm p-6 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1" style={{ background: color }} />
              
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-[10px] font-accent font-bold tracking-widest uppercase mb-0.5" style={{ color }}>{tema.type}</p>
                  <h3 className="font-display font-bold text-lg text-foreground leading-tight">{tema.name}</h3>
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto scrollbar-thin pr-2 mb-6">
                <p className="text-muted-foreground font-body text-sm leading-relaxed whitespace-pre-wrap">
                  {tema.description}
                </p>
              </div>

              <button 
                onClick={() => { setShowModal(false); onClick(); }}
                className="w-full py-3 rounded-sm font-accent font-bold text-xs text-primary-foreground transition-all hover:brightness-110 flex items-center justify-center gap-2"
                style={{ background: color }}
              >
                Explorar trilha <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export const TemaCardSkeleton = () => (
  <div className="hologram-panel rounded-sm overflow-hidden animate-pulse">
    <div className="h-1 bg-secondary/60" />
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-sm bg-secondary/60" />
        <div className="h-3 w-16 bg-secondary/40 rounded" />
      </div>
      <div className="h-5 bg-secondary/60 rounded w-3/4 mb-2" />
      <div className="h-3 bg-secondary/40 rounded w-full mb-1.5" />
      <div className="h-3 bg-secondary/40 rounded w-4/5 mb-4" />
      <div className="h-px bg-border/20 mb-3" />
      <div className="h-3 bg-secondary/30 rounded w-1/4" />
    </div>
  </div>
);