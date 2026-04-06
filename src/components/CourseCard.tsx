import { motion } from "framer-motion";
import { BarChart2, PlayCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type Course = {
  id: string;
  courses_id: string; // Alinhado com RoadmapSection.tsx
  name: string;
  difficult: string;
};

interface CourseCardProps {
  course: Course;
  onClick?: (course: Course) => void;
}

const getDifficultyConfig = (difficult: string) => {
  const configs: Record<string, { color: string; label: string; icon: typeof BarChart2 }> = {
    Iniciante:     { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Fundamental", icon: BarChart2 },
    Intermediário: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Intermediário", icon: BarChart2 },
    Avançado:      { color: "text-rose-400 bg-rose-500/10 border-rose-500/20", label: "Especialista", icon: BarChart2 },
  };
  return configs[difficult] || { color: "text-primary bg-primary/10 border-primary/20", label: difficult, icon: BarChart2 };
};

export const CourseCard = ({ course, onClick }: CourseCardProps) => {
  const navigate = useNavigate();
  const config = getDifficultyConfig(course.difficult);
  const DifficultyIcon = config.icon;

  const handleClick = () => {
    onClick?.(course);
    navigate(`/courses/${course.id}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.012, y: -2 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={handleClick}
      className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 glass-card border-white/5 hover:border-primary/30 transition-all cursor-pointer overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-primary/10"
    >
      {/* Background Animated Highlight */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.03] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Dynamic Glow Effect */}
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="flex items-start md:items-center gap-5 relative z-10">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/60 border border-white/5 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300 shadow-inner shrink-0">
          <PlayCircle size={24} className="text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110" />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg md:text-xl font-display font-bold text-white/90 group-hover:text-primary transition-colors leading-[1.3] max-w-2xl">
            {course.name}
          </h3>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
             <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] sm:text-[11px] font-accent font-black uppercase tracking-widest ${config.color} shadow-sm backdrop-blur-md`}>
              <DifficultyIcon size={12} strokeWidth={3} />
              {config.label}
            </div>
            
            <div className="flex items-center gap-1.5 text-white/20 font-mono text-[10px] uppercase tracking-tighter">
              <span className="w-1 h-1 rounded-full bg-white/20" />
              UID: {course.id.split('-')[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto relative z-10 md:border-l border-white/5 md:pl-8 group-hover:border-primary/20 transition-all">
        <div className="flex flex-col items-end md:items-start">
             <span className="text-[10px] font-accent font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-40 group-hover:opacity-100 transition-opacity">
               Duração Est.
             </span>
             <span className="text-xs font-display font-medium text-white/60 group-hover:text-white transition-colors">
               4h 30m
             </span>
        </div>
        
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-lg border border-white/5 group-hover:border-transparent group-hover:shadow-primary/30">
           <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};