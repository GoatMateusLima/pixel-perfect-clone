import { motion } from "framer-motion";
import { BarChart2, PlayCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type Course = {
  id: string;
  course_id: string;
  name: string;
  difficult: string;
};

interface CourseCardProps {
  course: Course;
  onClick?: (course: Course) => void;
}

const getDifficultyStyle = (difficult: string) => {
  const styles: Record<string, string> = {
    Iniciante:     "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    Intermediário: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    Avançado:      "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };
  return styles[difficult] || "text-primary bg-primary/10 border-primary/20";
};

export const CourseCard = ({ course, onClick }: CourseCardProps) => {
  const navigate = useNavigate();
  const difficultyStyle = getDifficultyStyle(course.difficult);

  const handleClick = () => {
    onClick?.(course);
    navigate(`/courses`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-border/80 transition-all cursor-pointer overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-start sm:items-center gap-4 relative z-10">
        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border/50 group-hover:border-primary/50 transition-colors shrink-0">
          <PlayCircle size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div>
          <h3 className="text-base font-display font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
            {course.name}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              ID: {course.course_id}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 relative z-10 border-t sm:border-t-0 border-border/30 pt-3 sm:pt-0">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border ${difficultyStyle}`}>
          <BarChart2 size={14} />
          <span className="text-[11px] font-accent font-bold uppercase tracking-wide">
            {course.difficult}
          </span>
        </div>
        <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform shrink-0" />
      </div>
    </motion.div>
  );
};