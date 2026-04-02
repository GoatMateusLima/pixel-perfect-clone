// src/components/TemaCard.tsx (Ajuste o caminho conforme seu projeto)
import { motion } from "framer-motion";
import {
  ArrowRight, GraduationCap, Code2, Shield, Brain, Cloud,
  Cpu, LineChart, Palette, Zap, Lock, Globe, BookOpen, TrendingUp
} from "lucide-react";
import type { Tema } from "../pages/RoadmapSection"; // Ajuste o caminho para onde estão seus types

//AHDHASDHASDHASDHAS

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
  const qtd = tema.courses?.length ?? 0;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 1, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="group relative hologram-panel rounded-sm cursor-pointer overflow-hidden transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
    >
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }} />

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-[10px] font-accent font-bold tracking-widest uppercase"
            style={{ color: `${color}cc` }}>
            {tema.type}
          </span>
        </div>

        <h2 className="font-display font-bold text-[1.05rem] text-foreground mb-2 leading-snug group-hover:text-glow transition-all">
          {tema.name}
        </h2>

        <p className="text-muted-foreground font-body text-[0.8rem] leading-relaxed line-clamp-2 mb-4">
          {tema.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-accent text-muted-foreground flex items-center gap-1.5">
            <GraduationCap size={11} style={{ color }} />
            {qtd} curso{qtd !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-accent opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color }}>
            Explorar <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </motion.div>
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