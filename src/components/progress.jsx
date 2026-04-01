import { motion } from "framer-motion";

export default function Progress({
  totalCursos = 0,
  cursosConcluidos = 0,
  cursosEmAndamento = 0,
  progressoMedio = 0,
  totalAulasAssistidas = 0,
  courseProgressList = [],
}) {
  const bars = [
    {
      label: "Trilhas concluídas",
      value: cursosConcluidos,
      total: totalCursos || 1,
      color: "hsl(155 60% 45%)",
    },
    {
      label: "Aulas assistidas",
      value: totalAulasAssistidas,
      total: courseProgressList.reduce((acc, c) => acc + c.totalAulas, 0) || 1,
      color: "hsl(25 90% 55%)",
    },
    {
      label: "Em andamento",
      value: cursosEmAndamento,
      total: totalCursos || 1,
      color: "hsl(210 70% 55%)",
    },
    {
      label: "Progresso médio",
      value: progressoMedio,
      total: 100,
      color: "hsl(45 90% 55%)",
      isPercent: true,
    },
  ];

  if (totalCursos === 0) {
    return (
      <div className="space-y-3">
        <p className="text-[10px] font-accent text-muted-foreground text-center py-4">
          Nenhum curso iniciado ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bars.map(({ label, value, total, color, isPercent }) => (
        <div key={label}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-accent text-muted-foreground">{label}</span>
            <span className="text-[10px] font-accent font-semibold" style={{ color }}>
              {isPercent ? `${value}%` : `${value}/${total}`}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((value / total) * 100, 100)}%` }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="h-full rounded-full"
              style={{ background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}