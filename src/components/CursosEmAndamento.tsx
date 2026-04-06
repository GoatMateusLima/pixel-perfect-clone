import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, ChevronRight, Loader2 } from "lucide-react";
import supabase from "../../utils/supabase";

export interface CourseProgress {
  courseId: string;
  courseName: string;
  difficult: string;
  totalAulas: number;
  completedAulas: number;
  pct: number;
  thumb?: string;
}

const DIFF_COLOR: Record<string, string> = {
  Iniciante: "hsl(155 60% 45%)",
  Intermediário: "hsl(45 85% 55%)",
  Avançado: "hsl(0 65% 58%)",
};

export const CursosEmAndamento = ({ userId }: { userId: string }) => {
  const [cursos, setCursos] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Busca cursos que o usuário começou (tabela watch)
        const { data: watchData } = await supabase
          .from("watch")
          .select("course_id, courses!course_id(id, name, difficult)")
          .eq("user_id", userId);

        if (!watchData || watchData.length === 0) { setLoading(false); return; }

        const result: CourseProgress[] = [];

        for (const w of watchData) {
          const course = Array.isArray(w.courses) ? w.courses[0] : w.courses as any;
          if (!course) continue;

          // Total de aulas do curso
          const { count: totalAulas } = await supabase
            .from("aulas")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id);

          // Aulas concluídas pelo usuário
          const { data: aulasCourse } = await supabase
            .from("aulas")
            .select("id")
            .eq("course_id", course.id);

          const aulaIds = (aulasCourse ?? []).map(a => Number(a.id));

          const { count: completedAulas } = await supabase
            .from("lesson_progress")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .in("aula_id", aulaIds.length > 0 ? aulaIds : [-1])
            .eq("completed", true);

          const total = totalAulas ?? 0;
          const completed = completedAulas ?? 0;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          // Só mostra cursos com pelo menos 1 aula concluída e não 100% (em andamento)
          if (completed > 0) {
            result.push({
              courseId: course.id,
              courseName: course.name,
              difficult: course.difficult ?? "Iniciante",
              totalAulas: total,
              completedAulas: completed,
              pct,
            });
          }
        }

        // Ordena por progresso decrescente
        result.sort((a, b) => b.pct - a.pct);
        setCursos(result);
      } catch (err) {
        console.error("[CursosEmAndamento] Erro ao carregar cursos:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) return (
    <div className="hologram-panel rounded-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Loader2 size={18} className="text-primary animate-spin" /> Cursos em Andamento
        </h2>
      </div>
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-sm border border-border/10 bg-secondary/10 animate-pulse">
            <div className="shrink-0 w-10 h-10 rounded-sm bg-secondary/20" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-secondary/30 rounded w-1/3" />
              <div className="h-1.5 bg-secondary/20 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (cursos.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 1, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="hologram-panel rounded-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <PlayCircle size={18} className="text-primary" /> Cursos em Andamento
        </h2>
        <span className="text-[11px] font-accent text-muted-foreground">{cursos.length} curso{cursos.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-3">
        {cursos.map((curso, i) => {
          const diffColor = DIFF_COLOR[curso.difficult] ?? "hsl(155 60% 45%)";
          const isConcluido = curso.pct === 100;
          return (
            <div key={curso.courseId}>
              <Link to={`/courses/${curso.courseId}`}
                className="flex items-center gap-4 p-4 rounded-sm border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                <div className="shrink-0 w-10 h-10 rounded-sm flex items-center justify-center"
                  style={{ background: `${diffColor}15`, border: `1px solid ${diffColor}30` }}>
                  <PlayCircle size={18} style={{ color: diffColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">{curso.courseName}</p>
                    <span className="shrink-0 text-[9px] font-accent font-bold px-1.5 py-0.5 rounded-sm"
                      style={{ color: diffColor, background: `${diffColor}15`, border: `1px solid ${diffColor}25` }}>
                      {curso.difficult}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${curso.pct}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: isConcluido ? "hsl(155 60% 45%)" : diffColor,
                          boxShadow: `0 0 6px ${isConcluido ? "hsl(155 60% 45%)" : diffColor}60`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] font-accent font-bold" style={{ color: isConcluido ? "hsl(155 60% 50%)" : diffColor }}>
                      {curso.pct}%
                    </span>
                  </div>

                  <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                    {curso.completedAulas} de {curso.totalAulas} aulas concluídas
                  </p>
                </div>

                <ChevronRight size={14} className="shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </Link>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CursosEmAndamento;
